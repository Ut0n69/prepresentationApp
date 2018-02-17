"use strict";

var socket = io.connect(location.origin);

var url = "";

var commentData = [];
var goodNum = void 0;
var heeNum = void 0;

var usrName = void 0;
var pageNum = void 0;

var Auth = {
  loggedIn: false,
  login: function login() {
    this.loggedIn = true;
  }

  // コメント受信
};socket.on("addComment", function (d) {
  commentData.unshift(d);
});

// いいね
socket.on("addGood", function (d) {
  goodNum = d;
});

// room入室
socket.emit("join", {
  roomid: "testroom",
  name: "testUsr"
});

// 初回読み込み時にスライド初期化
socket.emit("getCurrentPage");
socket.on("initPage", function (d) {
  PDFJS.getDocument(pdfFile).then(function (pdfDoc_) {
    pdfDoc = pdfDoc_;
    pageNum = d;
    renderPage(d);
  });
});

// スライドのページ変更受信
socket.on("renderingPage", function (d) {
  pageNum = d;
  renderPage(d);
});

// いいね数，へぇー数の取得
socket.emit("init");
socket.on("initData", function (d) {
  goodNum = d.good;
  heeNum = d.hee;
});

// キーボードイベント
document.onkeydown = function (e) {
  if (e.code == "ArrowRight" || e.code == "ArrowDown" || e.code == "Enter") {
    if (pageNum >= pdfDoc.numPages) {
      return;
    } else {
      socket.emit("onNextPage");
    }
  } else if (e.code == "ArrowLeft" || e.code == "ArrowUp") {
    if (pageNum <= 1) {
      return;
    } else {
      socket.emit("onPrevPage");
    }
  }
};

// app-main----------------------------
var appScreen = Vue.component("app-screen", {
  template: "\n    <div class=\"screen\">\n      <div class=\"screen-iframe\">\n        <iframe id=\"content\" src=\"" + url + "\" scrolling=\"no\"></iframe>\n      </div>\n      <h2>{{ title }}</h2>\n    </div>\n  ",
  data: function data() {
    return {
      title: "This is a slide title."
    };
  }
});

var appComment = Vue.component("app-comment", {
  template: "\n    <div class=\"comment\">\n      <div class=\"comment-input\">\n        <input v-model=\"text\" type=\"text\" placeholder=\"comment...\" />\n        <button class=\"btn\" @click=\"addComment()\">Submit</button>\n        <button @click=\"good()\" class=\"btn-good\">\u3044\u3044\u306D</button>\n        <div class=\"arrow-box\">{{ goodNum }}</div>\n        <button @click=\"hee()\" class=\"btn-hee\">\u3078\u3047\u301C</button>\n        <div class=\"arrow-box\">{{ heeNum }}</div>\n      </div>\n      <div class=\"comment-list\">\n        <ul>\n          <li v-for=\"(item, i) in list\" :key=\"item\">\n            <div class=\"card\">\n              <img src=\"/pict/icon.png\">\n              <div class=\"card-contents\">\n                <p><b>{{ item.name }}</b></p>\n                <p>{{ item.text }}</p>\n              </div>\n            </div>\n          </li>\n        </ul>\n      </div>\n    </div>\n  ",
  data: function data() {
    return {
      list: commentData,
      text: "",
      heeNum: heeNum,
      goodNum: goodNum
    };
  },
  created: function created() {
    var self = this;
    socket.on("addGood", function (d) {
      self.goodNum = d;
    });
    socket.on("addHee", function (d) {
      self.heeNum = d;
    });
  },
  methods: {
    addComment: function addComment() {
      if (this.text == "") {
        alert("Sorry. You gotta type something.");
      } else {
        socket.emit("sendComment", {
          text: this.text,
          name: usrName
        });
        this.text = "";
      }
    },
    good: function good() {
      socket.emit("getGood");
    },
    hee: function hee() {
      socket.emit("getHee");
    }
  }
});

var _main = {
  template: "\n    <div>\n      <app-screen></app-screen>\n      <app-comment></app-comment>\n    </div>\n  "

  // app-login----------------------------
};var appLogin = Vue.component("app-login", {
  template: "\n  <div>\n    <div class=\"app-login-title\">\n      <h1>PresentationApp</h1>\n    </div>\n    <div class=\"app-login\">\n      <input v-model=\"text\" type=\"text\" placeholder=\"Who are you...\" />\n      <br>\n      <button class=\"btn-join\" @click=\"join()\">JOIN</button>\n    </div>\n    <a class=\"app-login-presenter\" href=\"/#/presentation\"><button class=\"btn-presenter\" @click=\"reload()\">Click me, if you are presenter</button></a>\n  </div>\n",
  data: function data() {
    return {
      text: ""
    };
  },
  methods: {
    join: function join() {
      if (this.text == "") {
        socket.emit("join", {
          roomid: "testroom",
          name: "unknown"
        });
        usrName = "unknown";
        Auth.login();
        location.href = "/#/";
      } else {
        socket.emit("join", {
          roomid: "testroom",
          name: this.text
        });
        usrName = this.text;
        Auth.login();
        location.href = "/#/";
      }
    },
    reload: function reload() {
      setTimeout(function () {
        location.reload();
      }, 500);
    }
  }
});

var _login = {
  template: "\n    <app-login></app-login>\n  "

  // app-viewer----------------------------
};var appViewer = Vue.component("app-viewer", {
  template: "\n  <div class=\"presentation-screen\">\n    <canvas id=\"screen-canvas\"></canvas>\n  </div>\n",
  data: function data() {
    return {
      text: ""
    };
  }
});

var _viewer = {
  template: "\n    <app-viewer></app-viewer>\n  "

  // app-presentation----------------------------
};var appPresentation = Vue.component("app-presentation", {
  template: "\n  <div class=\"presentation-screen\">\n    <canvas id=\"screen-canvas\"></canvas>\n  </div>\n",
  data: function data() {
    return {
      text: ""
    };
  }
});

var _presentation = {
  template: "\n    <app-presentation></app-presentation>\n  "

  // router------------------
};var routes = [{
  path: "/",
  component: _main,
  meta: {
    requiresAuth: true
  }
}, {
  path: "/login",
  component: _login
}, {
  path: "/presentation",
  component: _presentation
}];

var router = new VueRouter({
  routes: routes
});

router.beforeEach(function (to, from, next) {
  if (to.matched.some(function (record) {
    return record.meta.requiresAuth;
  }) && !Auth.loggedIn) {
    next({
      path: '/login'
    });
  } else {
    next();
  }
});

var app = new Vue({
  el: "#app",
  router: router
});