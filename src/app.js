const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-body')
const koaStatic = require('koa-static')
const logger = require('koa-logger')
const Registers = {}
const Config = {
  port: 3000,
  defaultController: 'home',
  defaultAction: 'index',
  defaultMethod: 'get',
  routes: [],
  services: [],
  routers: []
}

//模块注册和加载
Koa.prototype.register = function(name,resolver,...params) {
  if(!name) throw new Error('register name not declared')
  if(!resolver) throw new Error('register module not declared')
  resolver.init && typeof resolver.init == 'function' && resolver.init(...params,app)
  Registers[name] = resolver
}
Koa.prototype.load = function(name){
  return Registers[name]
}

//初始化配置文件
Koa.prototype.configure = function(_config = {}) {
  Object.entries(_config).map(([key, value]) => {
    Config[key] = value
  })
  //格式化配置文件
  Config.routes = Config.routes.map(item => {
    const { path, method, controller, action } = item
    if (!controller || !action) {
      const [_controller, _action] = path.substring(1).split('/', 2)
      item.controller = controller || _controller || Config.defaultController
      item.action = action || _action || Config.defaultAction
    }
    if (!method) item.method = Config.defaultMethod
    return item
  })
}

const app = new Koa()

const setStatic = () => {
  if (!Config.staticPath) {
    throw new Error('configure staticPath not declared')
  }
  app.use(koaStatic(Config.staticPath))
}
const setServices = () => {
  if (Config.services.length === 0) return
  if (!Config.servicesPath) {
    throw new Error('configure servicesPath not declared')
  }
  const serviceMap = {}
  Config.services.forEach(serviceName => {
    const req = require(Config.servicesPath + '/' + serviceName)
    const serviceClass = req.default || req
    serviceMap[serviceName] = serviceClass
  })
  Object.defineProperties(app.context, {
    services: {
      get() {
        return serviceMap
      },
      configurable: true
    }
  })
}
const setRoutes = () => {
  if (!Config.controllerPath) {
    throw new Error('configure controllerPath not declared')
  }
  if (Config.routes.length + Config.routers.length === 0) {
    throw new Error('configure routes or routers not declared')
  }
  //合并路由配置
  Config.routes.forEach(item => {
    const { path, method, controller, action } = item
    const req = require(Config.controllerPath + '/' + controller)
    const controllerClass = req.default || req
    console.debug('load controller:',controller,'action',action)
    if(!controllerClass[action]){
      console.error('controller action '+action+' not declared')
    }else{
      Config.routers.push([method, path, controllerClass[action]])  
    }
  })
  const router = new Router()
  //加载路由
  Config.routers.forEach(([method, path, middleware]) => {
    router[method](path, middleware)
  })
  app.use(router.routes()).use(router.allowedMethods())
}

//启动服务
Koa.prototype.start = function(port = null) {
  setServices()
  setStatic()
  setRoutes()
  port = port || Config.port
  this.listen(port, () => {
    console.log(`the server is starting at port ${port}`)
  })
}
//注册中间件
app.use(logger())
app.use(bodyParser())

module.exports = app


