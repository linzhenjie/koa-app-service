const CONTEXT_SERVICE = Symbol('context#contextSERVICE')
const _CONTEXT_SERVICE = Symbol('context#_contextSERVICE')

module.exports = function(ops, app) {
  // 往ctx上挂载了SERVICE和CONTEXT_SERVICE属性， SERVICE处理逻辑保存在全局唯一的CONTEXT_SERVICE属性上
  extendContext(app.context, opts)

  return async function SERVICE(ctx, next) {
    const sess = ctx[CONTEXT_SERVICE]
    if (sess.store) await sess.initFromExternal()

    // 利用中间件，完成操作之后再set cookie.
    try {
      await next()
    } catch (err) {
      throw err
    } finally {
      // opts.autoCommit默认为true
      if (opts.autoCommit) {
        await sess.commit()
      }
    }
  }
}

// 可以看到该中间件的主逻辑就是就是extendContent方法，它往app.context上挂载了SERVICE属性

function extendContext(context, opts) {
  // 单例模式
  if (context.hasOwnProperty(CONTEXT_SERVICE)) {
    return
  }
  // 挂载SERVICE对象到context
  Object.defineProperties(context, {
    // 使用Symbol作为key,保证全局唯一
    [CONTEXT_SERVICE]: {
      get() {
        if (this[_CONTEXT_SERVICE]) return this[_CONTEXT_SERVICE]
        this[_CONTEXT_SERVICE] = new ContextSERVICE(this, opts)
        return this[_CONTEXT_SERVICE]
      }
    },
    SERVICE: {
      get() {
        return this[CONTEXT_SERVICE].get()
      },
      set(val) {
        this[CONTEXT_SERVICE].set(val)
      },
      configurable: true
    },
    SERVICEOptions: {
      get() {
        return this[CONTEXT_SERVICE].opts
      }
    }
  })
}
