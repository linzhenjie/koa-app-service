# koa-app-service

构建一个koa项目，集成MVC的结构，支持第三方依赖注入方法

## Bundled Middlewares

* koa-body
* koa-bodyparser
* koa-static
* koa-router
* koa-logger

## Usage

```js

const app = require('koa-app-service');
const path = require('path');

const routes = [
  {
    path: '/'
  },
  {
    path: '/admin'
  },
  {
    path: '/admin/login',
    method: 'post'
  }
]

//这里的配置可以写到配置文件里
app.configure({
  port: 3001,
  controllerPath: path.join(__dirname, './app/controllers'),
  staticPath: path.join(__dirname, './public'),
  servicesPath: path.join(__dirname, './app/services'),
  defaultController: 'home',
  defaultAction: 'index',
  defaultMethod: 'get',
  routes: routes,
  services: ['admin']
})
app.listen()
```


## Default Conifg

- port: 3000
- defaultController: home
- defaultAction: index
- defaultMethod: get

## use mysql

```js

const app = require('koa-app-service');
const mysql = require('./libs/mysql')

//这里的配置可以写到系统环境配置
app.register('mysql', mysql, {
  connectionLimit: 10,
  database: 'test',
  username: 'root',
  password: '123456',
  port: '3306',
  host: 'localhost'
})
```

```js

//libs/mysql.js
//示例，主要init方法做初始化

const mysql = require('mysql')

let pool = null

export default {
  init: config => {
    //初始化函数init 会在app.register的时候调用
    pool = mysql.createPool({
      connectionLimit: 10,
      host: config.host,
      user: config.username,
      password: config.password,
      database: config.database
    })
    pool.getConnection((err, conn) => {
      if (err) {
        throw new Error()
      } else {
        console.log('mysql connect success')
        pool.releaseConnection(conn)
      }
    })
  },
  query: (sql, ...values) => {
    return new Promise(resolve => {
      pool.getConnection((err, conn) => {
        if (err) {
          throw new Error()
        } else {
          conn.query(sql, values, (err, rows) => {
            pool.releaseConnection(conn)
            if (err) {
              console.error('数据库查询失败 sql:', sql, 'values', values)
              throw new Error()
            } else {
              const data =
                rows.length > 0 ? JSON.parse(JSON.stringify(rows)) : []
              resolve(data)
            }
          })
        }
      })
    })
  }
}
```

```js
//app/service/admin.js
const mysql = require('koa-app-service').mysql

export default {
  async login(ctx) {
    const { request, services } = ctx
    const res = await services.admin.checkLogin(
      request.body.username,
      request.body.password
    )
    ctx.body = { code: 0, msg: '登录成功', data: res }
  }
}
```

```js
import app from 'koa-app-service'

export default {
  async checkLogin(username, password) {
    if (username.length < 3) throw new Error('用户名输入错误')
    if (password.length < 6) throw new Error('密码输入错误')
    const res = await app
      .load('db')
      .query(
        'select id from user_info where username = ? and password = ?',
        username,
        password
      )
    if (res.length <= 0) throw new Error('用户名或密码错误')
    return { id: res[0].id }
  }
}
```



## License

See [LICENSE](./LICENSE)