const si = require('systeminformation');
var apm = require('../bin/www');
var log= apm.apm;
var os = require('os');
var http = require('http');
const querystring = require('querystring');

var hostname=process.env.LOG_HOSTNAME;
var port=process.env.LOG_PORT;
var serviceName= process.env.NAME;


const options = {
  hostname,
  port,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};


exports.send=function()
{
    /*system load
  [ 0.84423828125, 0.5849609375, 0.44189453125 ]
  [1,5,15]
  */
  var load= new Promise(function(resolve,reject)
    {
      let avg=os.loadavg();
      let ncpu=os.cpus().length
      let load=
      {
        loadAvg1min: parseFloat(avg[0]),
        loadAvg5min: parseFloat(avg[1]),
        loadAvg15min: parseFloat(avg[2]),
        ncpu,
      }
      resolve(load);
    });

  /*cpu load
  {
    avgload: 0.48,
    currentload: 4.540867810292633,
  }
  */
  var cpuLoad =  si.currentLoad().then(cpu=>{return{'cpuLoad':cpu.currentload,'cpuAvgLoad':cpu.avgload}});

  /*memory load
  {
    total: 12463538176,
    free: 4613128192,
    used: 7849766912,
    active: 4233068544,
    available: 7790964736
  }
  */
  var memLoad=si.mem().then(mem=>{
    return {
        totalMem: mem.total,
        freeMem: mem.free,
        usedMem: mem.used,
        availableMem: mem.available
      }
  });

  /*network load
  [ { iface: 'lxdbr0',
      operstate: 'up',
      rx: 559667,
      tx: 5356664,
      rx_sec: 8.356251322191664,
      tx_sec: 39.39073408081235,
      ms: 47270 },]*/
  let netLoad=si.networkInterfaces().then(ifcs=>ifcs.filter((ifc)=>ifc.iface!=='lo').map(ifc=>ifc.iface).map(ifc=>si.networkStats(ifc))).then(arr=>Promise.all(arr));
  let netLoadRx=netLoad.then(ar=>{return{netLoadRx:ar.map(v=>v.rx_sec).reduce((a,b)=>a+b)}});
  let netLoadTx=netLoad.then(ar=>{return{netLoadTx:ar.map(v=>v.tx_sec).reduce((a,b)=>a+b)}});

  Promise.all([load,cpuLoad,memLoad,netLoadRx,netLoadTx]).then(
    ([load,cpuLoad,memLoad,netLoadRx,netLoadTx])=>
      {
        let metrics=Object.assign({},load,cpuLoad,memLoad,netLoadRx,netLoadTx);
        Object.keys(metrics).map((key)=>metrics[key]=metrics[key].toFixed(3));

        metrics.serviceName=serviceName;
        let metricsKV=querystring.stringify(metrics," ");
        let send= options;
        Object.assign(send.headers,{'Content-Length': Buffer.byteLength(metricsKV)});

        const req = http.request(options, (res) => {res.setEncoding('utf8')});
        req.on('error', (e) => {
          console.error(`problem with request: ${e.message}`);
        });

      // write data to request body
        req.write(metricsKV);
        req.end();

      });

}
