const fs = require('fs')
const path = require('path')

const getToilets = () => {
  const { toilets } = JSON.parse(fs.readFileSync(`${path.resolve()}/toilet.json`))
  return toilets
}

const writeToilets = (toilets) => {
  const data = { toilets }
  fs.writeFileSync(`${path.resolve()}/toilet.json`, JSON.stringify(data, null, 2))
}

const getState = (gender) => {
  let toilets = getToilets()
  if (gender) {
    toilets = toilets.filter(t => t.gender === gender)
  }
  return toilets
}

const formatter = (toilets) => {
  if (!Array.isArray(toilets)) {
    console.error("Get wrong type of toilets")
    return null
  }
  const text = {
    text: `${toilets[0].desc} is ${toilets[0].status ? 'occupied' : 'free'}`
  }

  if (toilets[0].status) {
    text['attachments'] = [
      {
        text: "Do you want to join the waiting list?",
        callback_id: "join_waiting",
        color: "#3AA3E3",
        actions: [
          {
            name: `wait_${toilets[0].gender}`,
            text: "Join",
            type: "button",
            value: "yes"
          },
          {
            name: `wait_${toilets[0].gender}`,
            text: "Not join",
            type: "button",
            value: "no"
          }
        ]
      }
    ]
  }
  return text
}

const joinWaiting = (actions, user) => {
  if (Array.isArray(actions) && actions.length) {
    const action = actions[0]
    const { name, value } = action
    if (value === 'yes') {
      const toliets = getToilets()
      toliets.forEach(t => {
        if (name === `wait_${t.gender}`) {
          const exist = t.waiting_list.find(u => u.id === user.id)
          if (!exist) {
            t.waiting_list.push(user)
          } else {
            return 'You have joined the queue'
          }
        }
      })
      writeToilets(toliets)
      return 'You have successfully joined the queue'
    } else {
      return `It's OK, maybe you are not in hurry ` 
    }
  }
}

const getWaitingList = (toiletId) => {
  const toilets = getToilets()
  const toilet = toilets.find(t =>  t.id === toiletId)
  if (toilet) {
    const { waiting_list } = toilet 
    return waiting_list
  }
  return []
}

const updateToilet = (toiletId, status, timeStamp) => {
  let toilets = getToilets()
  toilets = toilets.map(t => {
    if (t.id === toiletId) {
      t.status = status
      t.last_modified = timeStamp
      if (status === false) {
        t.waiting_list = []
      } 
    }
  })
  writeToilets(toilets)
}

module.exports = (robot) => {
  robot.hear(/state-men/i, function(res) {
    return res.send(formatter(getState('male')))
  })

  robot.hear(/state-women/i, function(res) {
    return res.send(formatter(getState('female')))
  })

  robot.router.post('/hubot/actions/:room', function(req, res) {
    const data = req.body.payload != null ? JSON.parse(req.body.payload) : req.body
    const { callback_id, actions, user } = data
    let message = 'OK'
    if (callback_id === 'join_waiting') {
      message = joinWaiting(actions, user)
    }
    const room = robot.adapter.client.rtm.dataStore.getDMByName(user.name)
    console.log(room)
    return robot.messageRoom(room.id, message)
    // return res.send(message)
  })

  robot.router.post('/hubot/toilet/:id', function(req, res) {
    const id = req.params.id
    const data = req.body.payload != null ? JSON.parse(req.body.payload) : req.body
    const { status, timeStamp } = data
    // Set toilet
    const usersToNotify = getWaitingList(id)
    updateToilet(id, status, timeStamp)
    if (status === false) {
      usersToNotify.forEach(usr => {
        robot.messageRoom(usr.name, `Toilet ${id} is empty now, rush to it before some one occupy it`)
      })
    }
    return res.send({ result: 'success' })
  })
}