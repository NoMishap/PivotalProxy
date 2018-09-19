var http = require('http');
var options = {
  host:  process.env.SERVICE
};


exports.get= function(req,res)
{
  http.request(options, (response)=>callback(response,res)).end();
};


function callback(response,writer)
{
  var str = '';
  response.on('data',chunk =>str += chunk);
  response.on('end', ()=>
    {
      writer.send(str);
      writer.end();;
    });
}//callback

function convert(writer)
{
    http.request(options, (response)=>callback(response,writer)).end();
}
