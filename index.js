const format = require('util').format;
const sliced = require('sliced');
const isDom = require('is-dom');
const fs = require('fs');

module.exports = consoleRedirect
function consoleRedirect (stdout, stderr, replace, file) {
  let methods = ['error', 'info', 'log', 'warn']
  if (typeof console.debug === 'function') { 
    // only exists in browser
    methods.push('debug')
  }
  
  let nativeConsole = {}
  methods.forEach(function (k) {
    let nativeMethod = console[k]
    nativeConsole[k] = nativeMethod.bind(console)

    console[k] = function () {
      let args = sliced(arguments)
      let isError = k === 'error' || k === 'warn'
      let writable = isError ? stderr : stdout
      write(writable, args, file)
      if (!replace) {
        return nativeMethod.apply(this, args)
      }
    }
  })
  
  return {
    release: release
  }
  
  function release () {
    methods.forEach(function (k) {
      console[k] = nativeConsole[k]
    })
  }
}

function write (writable, args) {
  let cleanArgs = args.map(function (arg) {
    return arg && isDom(arg) ? arg.toString() : arg
  })
  let output = format.apply(null, cleanArgs)
  if (writable) {
    writable.write(output + '\n');
    
    if (file) {
      let stream = fs.createWriteStream(file);
      stream.once('open', function(fd) {
        stream.write(output+"\n");
        stream.end();
      });
    }
  }
}
