const socket = io.connect(location.origin)

const url = "http://192.168.2.103:8080/#/presentation"

let commentData = []
let goodNum
let heeNum

let usrName
let pageNum

let Auth = {
  loggedIn: false,
  login: function () {
    this.loggedIn = true
  }
}

// コメント受信
socket.on("addComment", function (d) {
  commentData.unshift(d)
})

// いいね
socket.on("addGood", function (d) {
  goodNum = d
})

// room入室
socket.emit("join", {
  roomid: "testroom",
  name: "testUsr"
})

// 初回読み込み時にスライド初期化
socket.emit("getCurrentPage")
socket.on("initPage", function (d) {
  pdfjs.getDocument(pdfFile).then(function (pdfDoc_) {
    pdfDoc = pdfDoc_
    pageNum = d
    renderPage(d)
  })
})

// スライドのページ変更受信
socket.on("renderingPage", function (d) {
  pageNum = d
  renderPage(d)
})

// いいね数，へぇー数の取得
socket.emit("init")
socket.on("initData", function (d) {
  goodNum = d.good
  heeNum = d.hee
})

// キーボードイベント
document.onkeydown = function (e) {
  if (e.code == "ArrowRight" || e.code == "ArrowDown" || e.code == "Enter") {
    if (pageNum >= pdfDoc.numPages) {
      return
    } else {
      socket.emit("onNextPage")
    }
  } else if (e.code == "ArrowLeft" || e.code == "ArrowUp") {
    if (pageNum <= 1) {
      return
    } else {
      socket.emit("onPrevPage")
    }
  }
}

// app-main----------------------------
const appScreen = Vue.component("app-screen", {
  template: `
    <div class="screen">
      <div class="screen-iframe">
        <iframe id="content" src="${url}" scrolling="no"></iframe>
      </div>
      <h2>{{ title }}</h2>
    </div>
  `,
  data: function () {
    return {
      title: "This is a slide title."
    }
  }
})

const appComment = Vue.component("app-comment", {
  template: `
    <div class="comment">
      <div class="comment-input">
        <input v-model="text" type="text" placeholder="comment..." />
        <button class="btn" @click="addComment()">Submit</button>
        <button @click="good()" class="btn-good">いいね</button>
        <div class="arrow-box">{{ goodNum }}</div>
        <button @click="hee()" class="btn-hee">へぇ〜</button>
        <div class="arrow-box">{{ heeNum }}</div>
      </div>
      <div class="comment-list">
        <ul>
          <li v-for="(item, i) in list" :key="item">
            <div class="card">
              <img src="/pict/icon.png">
              <div class="card-contents">
                <p><b>{{ item.name }}</b></p>
                <p>{{ item.text }}</p>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  `,
  data: function () {
    return {
      list: commentData,
      text: "",
      heeNum: heeNum,
      goodNum: goodNum
    }
  },
  created: function () {
    var self = this
    socket.on("addGood", function (d) {
      self.goodNum = d
    })
    socket.on("addHee", function (d) {
      self.heeNum = d
    })
  },
  methods: {
    addComment: function () {
      if (this.text == "") {
        alert("Sorry. You gotta type something.")
      } else {
        socket.emit("sendComment", {
          text: this.text,
          name: usrName
        })
        this.text = ""
      }
    },
    good: function () {
      socket.emit("getGood")
    },
    hee: function () {
      socket.emit("getHee")
    }
  }
})

const _main = {
  template: `
    <div>
      <app-screen></app-screen>
      <app-comment></app-comment>
    </div>
  `
}

// app-login----------------------------
const appLogin = Vue.component("app-login", {
  template: `
  <div  class="bg">
    <div class="app-login">
      <h1>PresentationApp</h1>
      <input v-model="text" type="text" placeholder="Who are you..." />
      <button class="btn-join" @click="join()">JOIN</button>
      <a class="app-login-presenter" href="/#/presentation"><button class="btn-presenter" @click="reload()">Click me, if you are presenter</button></a>
    </div>
  </div>
`,
  data: function () {
    return {
      text: ""
    }
  },
  methods: {
    join: function () {
      if (this.text == "") {
        socket.emit("join", {
          roomid: "testroom",
          name: "unknown"
        })
        usrName = "unknown"
        Auth.login()
        location.href = "/#/"
      } else {
        socket.emit("join", {
          roomid: "testroom",
          name: this.text
        })
        usrName = this.text
        Auth.login()
        location.href = "/#/"
      }
    },
    reload: function () {
      setTimeout(() => {
        location.reload()
      }, 500)
    }
  }
})

const _login = {
  template: `
    <app-login></app-login>
  `
}


// app-viewer----------------------------
const appViewer = Vue.component("app-viewer", {
  template: `
  <div class="presentation-screen">
    <canvas id="screen-canvas"></canvas>
  </div>
`,
  data: function () {
    return {
      text: ""
    }
  }
})

const _viewer = {
  template: `
    <app-viewer></app-viewer>
  `
}

// app-presentation----------------------------
const appPresentation = Vue.component("app-presentation", {
  template: `
  <div class="presentation-screen">
    <canvas id="screen-canvas"></canvas>
  </div>
`,
  data: function () {
    return {
      text: ""
    }
  }
})


const _presentation = {
  template: `
    <app-presentation></app-presentation>
  `
}

// router------------------
const routes = [{
    path: "/",
    component: _main,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/login",
    component: _login
  },
  {
    path: "/presentation",
    component: _presentation
  }
]

const router = new VueRouter({
  routes
})

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth) && !Auth.loggedIn) {
    next({
      path: '/login'
    })
  } else {
    next()
  }
})

const app = new Vue({
  el: "#app",
  router
})