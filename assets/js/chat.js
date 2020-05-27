
var getdata = []

if (location.search.length > 1) {
  var ls = location.search.substring(1)

  var namevalue = ls.split("%")
  for (var i=0; i<namevalue.length; i++){
    var data = namevalue[i].split("=")
    getdata[data[0]] = data[1]
  }
}

var s = ""
for (var el in getdata){
  s += el + ": " + getdata + "\n"
}
const DOM = {
  membersCount: document.querySelector('.members-count'),
  membersList: document.querySelector('.members-list'),
  messages: document.querySelector('.messages'),
  input: document.querySelector('.message-form__input'),
  form: document.querySelector('.message-form'),
}

const CLIENT_ID = '7Fn5dbKDqBjuFasF'
var useName

if (getdata["nick"]){
  useName = getdata["nick"]
} else {
  useName = getRandomName()
}
const drone = new ScaleDrone(CLIENT_ID, {
  data: {
    name: useName,
    color: getRandomColor(),
  },
})

let members = []

drone.on('open', error => {
  if (error) {
    addServerMessagetoListDOM("Failed to connect.")
    return console.error(error)
  }
  addServerMessagetoListDOM("Connecting...")

  const room = drone.subscribe('observable-room')
  room.on('open', error => {
    if (error) {
      addServerMessagetoListDOM("Failed to connect: "+error)
      return console.error(error)
    }
    addServerMessagetoListDOM("Welcome!")
    console.log('Successfully joined room')
  })

  room.on('members', m => {
    members = m
    updateMembersDOM()
  })

  room.on('member_join', member => {
    members.push(member)
    updateMembersDOM()
    addServerMessagetoListDOM(member.clientData.name+" has joined.")
  })

  room.on('member_leave', ({id}) => {
    const index = members.findIndex(member => member.id === id)
    addServerMessagetoListDOM(members[index].clientData.name+" has left.")
    members.splice(index, 1)
    updateMembersDOM()
  })

  room.on('data', (text, member) => {
    if (text.kick){
      if (text.kick == true){
        addServerMessagetoListDOM("You have been disconnected from this room.")
        drone.close()
      } else if (text.kick == useName) {
        addServerMessagetoListDOM("You have been disconnected from this room.")
        drone.close()
      }
    } else {
      if (member) {
        if (text.startsWith("crypted:")){
          if (getdata["crypt"]){
            const decrypt = decipher(getdata["crypt"])
            var detext = decrypt(text.split(":-")[1])
            if (detext.startsWith("suc:x")){
              addMessageToListDOM(detext.split("suc:x")[1], member)
            }
          }
        } else {
          addMessageToListDOM(text, member)
        }
      } else {
        addServerMessagetoListDOM(text.display)
      }
    }
  })
})

drone.on('close', event => {
})

drone.on('error', error => {
  console.error(error)
})

function getRandomName() {
  const adjs = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter", "patient", "twilight", "dawn", "crimson", "wispy", "weathered", "blue", "billowing", "broken", "cold", "damp", "falling", "frosty", "green", "long", "late", "lingering", "bold", "little", "morning", "muddy", "old", "red", "rough", "still", "small", "sparkling", "throbbing", "shy", "wandering", "withered", "wild", "black", "young", "holy", "solitary", "fragrant", "aged", "snowy", "proud", "floral", "restless", "divine", "polished", "ancient", "purple", "lively", "nameless"]
  const nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter", "forest", "hill", "cloud", "meadow", "sun", "glade", "bird", "brook", "butterfly", "bush", "dew", "dust", "field", "fire", "flower", "firefly", "feather", "grass", "haze", "mountain", "night", "pond", "darkness", "snowflake", "silence", "sound", "sky", "shape", "surf", "thunder", "violet", "water", "wildflower", "wave", "water", "resonance", "sun", "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper", "frog", "smoke", "star"]
  return (
    adjs[Math.floor(Math.random() * adjs.length)] +
    "_" +
    nouns[Math.floor(Math.random() * nouns.length)]
  )
}

function getRandomColor() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16)
}

//------------- DOM STUFF


DOM.form.addEventListener('submit', sendMessage)

function sendMessage() {
  var value = DOM.input.value
  if (value === '') {
    return
  }
  if (getdata["crypt"]){
    const encrypt = cipher(getdata["crypt"])
    value = "crypted:-"+encrypt("suc:x"+value)
  }
  drone.publish({
    room: 'observable-room',
    message: value
  })
  DOM.input.value = ''
}

function createMemberElement(member) {
  if (!member.clientData) return
  const { name, color } = member.clientData
  const el = document.createElement('div')
  el.appendChild(document.createTextNode(name))
  el.className = 'member'
  el.style.color = color
  return el
}

function updateMembersDOM() {
  DOM.membersCount.innerText = `${members.length} users in room:`
  DOM.membersList.innerHTML = ''
  members.forEach(member => {
    if (!member) return
    DOM.membersList.appendChild(createMemberElement(member))
  }
  )
}

function createMessageElement(text, member) {
  const el = document.createElement('div')
  el.appendChild(createMemberElement(member))
  el.appendChild(document.createTextNode(text))
  el.className = 'message'
  return el
}

function addMessageToListDOM(text, member) {
  
  const el = DOM.messages
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight
  el.appendChild(createMessageElement(text, member))
  if (wasTop) {
    el.scrollTop = el.scrollHeight - el.clientHeight
  }
}

function createImageMessageElement(img, member) {
  const el = document.createElement('div')
  const imgs = document.createElement('img')
  imgs.src = img
  el.appendChild(createMemberElement(member))
  el.appendChild(imgs)
  el.className = 'message'
  return el
}

function addImageToListDOM(img, member) {
  
  const el = DOM.messages
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight
  el.appendChild(createImageMessageElement(img, member))
  if (wasTop) {
    el.scrollTop = el.scrollHeight - el.clientHeight
  }
}

function createServerMessageElement(text) {
  const el = document.createElement('div')
  el.appendChild(document.createTextNode(text))
  el.className = 'message'
  return el
}

function addServerMessagetoListDOM(text) {
  const el = DOM.messages
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight
  el.appendChild(createServerMessageElement(text))
  if (wasTop) {
    el.scrollTop = el.scrollHeight - el.clientHeight
  }
}

