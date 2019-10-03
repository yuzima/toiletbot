const fs = require('fs')
const path = require('path')
// const { WebClient } = require('@slack/client') 
// const SLACK_APP_TOKEN="xoxb-3630464077-783599359335-4Pz5lv8xmcWCnEn4LRbDqb0Q"

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

module.exports = (robot) => {
  robot.hear(/state-men/i, function(res) {
    return res.send(formatter(getState('male')))
  })

  robot.hear(/state-women/i, function(res) {
    return res.send(formatter(getState('female')))
  })

  robot.router.post('/hubot/actions/:room', function(req, res) {
    // let data, room, secret
    // room = req.params.room
    const data = req.body.payload != null ? JSON.parse(req.body.payload) : req.body
    // secret = data.secret
    // robot.messageRoom(room, "I have a secret: " + secret)
    const { callback_id, actions, user } = data
    let message = 'OK'
    if (callback_id === 'join_waiting') {
      message = joinWaiting(actions, user)
    }
    return res.send(message)
  })

  robot.router.post('/hubot/toilet/:id', function(req, res) {
    const id = req.params.id
    const data = req.body.payload != null ? JSON.parse(req.body.payload) : req.body
    // const { id, status, timeStamp } = data
    console.log('toilet id: ' + id)
    console.log(data)
    // const toliets = getToilets()
  })
}