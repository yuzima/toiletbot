const fs = require('fs')
const path = require('path')

const getToilets = () => {
  const { toilets } = JSON.parse(fs.readFileSync(`${path.resolve()}/toilet.json`))
  return toilets
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
            name: "wait",
            text: "Join",
            type: "button",
            value: "yes"
          },
          {
            name: "wait",
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

module.exports = (robot) => {
  robot.hear(/state-men/i, function(res) {
    console.log(formatter(getState('male')))
    return res.send(formatter(getState('male')))
  })

  robot.hear(/state-women/i, function(res) {
    return res.send(getState('female'))
  })
}