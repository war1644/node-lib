import { MongoClient } from 'mongodb';

// const { MongoClient } = require('mongodb');

export class Tool {

  static getMemoryUsage() {
      const mem = process.memoryUsage();
      const format = (bytes) => {
          return (bytes / 1024 / 1024).toFixed(2)
      }

      return format(mem.rss)
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
  
  static getMemoryUsage() {
      const mem = process.memoryUsage();
      const format = (bytes) => {
          return (bytes / 1024 / 1024).toFixed(2)
      }

      return format(mem.rss)
  }

  static writeFile() {
      // const today = tool.Utils.dateNow('yyyyMMdd')
      // fs.appendFile(`monit_${today}.log`, info,(e)=>{
      //     console.log('fs.appendFile',e)
      // });
  }

  static log(msg, tag) {
      TSLog.log(msg, tag)
  }

  static maxData = { docs: 0, ram: 0, conns: 0, sub: 0, pub: 0 }

  static dateNow(fmt = 'yyyy-MM-dd hh:mm:ss') {
      const now = new Date()
      let o = {
          "M+": now.getMonth() + 1,                 // 月份
          "d+": now.getDate(),                    // 日
          "h+": now.getHours(),                   // 小时
          "m+": now.getMinutes(),                 // 分
          "s+": now.getSeconds(),                 // 秒
          "q+": Math.floor((now.getMonth() + 3) / 3), // 季度
          "S": now.getMilliseconds()             // 毫秒
      };
      if (/(y+)/.test(fmt)) {
          fmt = fmt.replace(RegExp.$1, (String(now.getFullYear())).substr(4 - RegExp.$1.length))
      }

      for (let k in o) {
          if (new RegExp("(" + k + ")").test(fmt)) {
              fmt = fmt.replace(
                  RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr((String(o[k])).length)))
          }
      }

      return fmt
  }

  static uuid() {
      // return uuidv4()
  }
}

export class TSLog {
  //log_level: 0      # 0 debug， 1 info, 2 warn, 3 error
  static log_level = process.env.LOG_LEVEL ?? 0

  static warn(...arg) {
    this.printf('[WARN]$',...arg)
  }

  static error(...arg) {
    this.printf('[ERROR]$',...arg)
  }

  static debug(...arg) {
    this.printf('[DEBUG]$',...arg)
  }

  static info(...arg) {
    this.printf('[INFO]$',...arg)
  }
  static log(...arg) {
    this.printf('[INFO]$',...arg)
  }

  static printf(...arg) {
      switch (arg[0]) {
        case '[DEBUG]$':
          if(this.log_level>0) return
        case '[INFO]$':
          if(this.log_level>1) return
        case '[WARN]$':
            if(this.log_level>2) return
            //2021/08/05-11:12:14.779 TS /websocket-master/cache/rocket_ins.go:101 [DEBUG]$ consume message successfully.
            console.log(Tool.dateNow('yyyy/MM/dd-hh:mm:ss.S'),'TS',this.getCallerPath(),...arg)
            break;
        case '[ERROR]$':
            if(this.log_level>3) return
            console.error(Tool.dateNow('yyyy/MM/dd-hh:mm:ss.S'),'TS',this.getCallerPath(), ...arg)
            break;
      }
  }

  static getCallerPath(){
      var orig = Error.prepareStackTrace;
      Error.prepareStackTrace = (_, stack)=>{ return stack; };
      var err = new Error;
      var stack = err.stack;
      Error.prepareStackTrace = orig;
      // stack[0]为当前函数, stack[1]为调用者，stack[2]为上层调用者
      // StackTrace还有其它方法，可以获取调用者行数、位置信息等：
      // getPosition
      // getFunction
      // getFunctionName
      // getFileName
      // getLineNumber
      return stack[3].getFileName()+':'+stack[3].getLineNumber()
}



}


// 更多详细用法参考：https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html
export class Mongo {
  static db
  static client
  static curCollection
  static collectionMap = new Map()

  static async initDb (uri='mongodb://127.0.0.1/tianwen',collName){
    if(this.db) {
      return this.db
    }
    try {
      this.client = new MongoClient(uri)
      await this.client.connect()
      this.db = this.client.db()
      if(collName){
        this.getCollection(collName)
      }
    } catch (error) {
      TSLog.error('[MongoDB]','MongoDB init error',error)
    }
    return this.db
  }

  static transactionOptions = {
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' }
  }

  static async start(){
    TSLog.log('startSession', '[MongoDB db]')
    // this.initDb()
    // TSLog.info(this.db);
    const session = this.client.startSession();
    // TSLog.log(session);

    try {
        session.startTransaction(this.transactionOptions);
        TSLog.log(`事务状态：${session.transaction.state}`)
        return session
    } catch(err) {
      TSLog.error(err,'[MongoDB transaction] ERROR')
    }
  }

  static async abort(session){
    await session.abortTransaction();
    await this.end(session)
  }

  static async commit (session){
    await session.commitTransaction();
    TSLog.debug(`事务状态：${session.transaction.state}`)
    await this.end(session)
  }
  
  static async end (session){
    await session.endSession();
    TSLog.debug(`事务状态：${session.transaction.state}`)
  }

  static getAndSetCollection (name) {
    if(this.collectionMap.has(name)){
      this.curCollection = this.collectionMap.get(name);
      return this.curCollection
    }
    this.curCollection = this.db.collection(name);
    this.collectionMap.set(name,this.curCollection)
    return this.curCollection
  }

  static getCollection (name) {
    if(this.collectionMap.has(name)){
      return this.collectionMap.get(name);
    }
    const coll = this.db.collection(name);
    this.collectionMap.set(name,coll)
    return coll
  }

  static getUpdates = docs => {
    if (!Array.isArray(docs) || !docs.length) return []
    return docs.map(update => update.value.buffer)
  }
}


// module.exports = {
//   TSLog,
//   Tool,
//   Mongo
// }


