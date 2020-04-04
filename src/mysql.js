import mysql from 'mysql'
import config from '../config/mysql.config'

const pool = mysql.createPool({
  connectionLimit: 10,
  host: config.host,
  user: config.username,
  password: config.password,
  database: config.database
})

export default {
  query: (sql, ...values) => {
    return new Promise(resolve => {
      pool.getConnection((err, connection) => {
        if (err) {
          console.error('数据库连接失败')
          throw new Error()
        } else {
          connection.query(sql, values, (err, rows) => {
            connection.release()
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
  },
  exec: (sql, ...values) => {
    new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          console.log(err)
          resolve(err)
        } else {
          connection.query(sql, values, (err, rows) => {
            if (err) {
              reject(err)
            } else {
              resolve(rows)
            }
            connection.release()
          })
        }
      })
    })
  }
}
