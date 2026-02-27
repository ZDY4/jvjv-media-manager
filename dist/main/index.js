"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/isexe/windows.js
var require_windows = __commonJS({
  "node_modules/isexe/windows.js"(exports2, module2) {
    module2.exports = isexe;
    isexe.sync = sync;
    var fs9 = require("fs");
    function checkPathExt(path11, options) {
      var pathext = options.pathExt !== void 0 ? options.pathExt : process.env.PATHEXT;
      if (!pathext) {
        return true;
      }
      pathext = pathext.split(";");
      if (pathext.indexOf("") !== -1) {
        return true;
      }
      for (var i = 0; i < pathext.length; i++) {
        var p = pathext[i].toLowerCase();
        if (p && path11.substr(-p.length).toLowerCase() === p) {
          return true;
        }
      }
      return false;
    }
    function checkStat(stat, path11, options) {
      if (!stat.isSymbolicLink() && !stat.isFile()) {
        return false;
      }
      return checkPathExt(path11, options);
    }
    function isexe(path11, options, cb) {
      fs9.stat(path11, function(er, stat) {
        cb(er, er ? false : checkStat(stat, path11, options));
      });
    }
    function sync(path11, options) {
      return checkStat(fs9.statSync(path11), path11, options);
    }
  }
});

// node_modules/isexe/mode.js
var require_mode = __commonJS({
  "node_modules/isexe/mode.js"(exports2, module2) {
    module2.exports = isexe;
    isexe.sync = sync;
    var fs9 = require("fs");
    function isexe(path11, options, cb) {
      fs9.stat(path11, function(er, stat) {
        cb(er, er ? false : checkStat(stat, options));
      });
    }
    function sync(path11, options) {
      return checkStat(fs9.statSync(path11), options);
    }
    function checkStat(stat, options) {
      return stat.isFile() && checkMode(stat, options);
    }
    function checkMode(stat, options) {
      var mod = stat.mode;
      var uid = stat.uid;
      var gid = stat.gid;
      var myUid = options.uid !== void 0 ? options.uid : process.getuid && process.getuid();
      var myGid = options.gid !== void 0 ? options.gid : process.getgid && process.getgid();
      var u = parseInt("100", 8);
      var g = parseInt("010", 8);
      var o = parseInt("001", 8);
      var ug = u | g;
      var ret = mod & o || mod & g && gid === myGid || mod & u && uid === myUid || mod & ug && myUid === 0;
      return ret;
    }
  }
});

// node_modules/isexe/index.js
var require_isexe = __commonJS({
  "node_modules/isexe/index.js"(exports2, module2) {
    var fs9 = require("fs");
    var core;
    if (process.platform === "win32" || global.TESTING_WINDOWS) {
      core = require_windows();
    } else {
      core = require_mode();
    }
    module2.exports = isexe;
    isexe.sync = sync;
    function isexe(path11, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      if (!cb) {
        if (typeof Promise !== "function") {
          throw new TypeError("callback not provided");
        }
        return new Promise(function(resolve, reject) {
          isexe(path11, options || {}, function(er, is) {
            if (er) {
              reject(er);
            } else {
              resolve(is);
            }
          });
        });
      }
      core(path11, options || {}, function(er, is) {
        if (er) {
          if (er.code === "EACCES" || options && options.ignoreErrors) {
            er = null;
            is = false;
          }
        }
        cb(er, is);
      });
    }
    function sync(path11, options) {
      try {
        return core.sync(path11, options || {});
      } catch (er) {
        if (options && options.ignoreErrors || er.code === "EACCES") {
          return false;
        } else {
          throw er;
        }
      }
    }
  }
});

// node_modules/fluent-ffmpeg/node_modules/which/which.js
var require_which = __commonJS({
  "node_modules/fluent-ffmpeg/node_modules/which/which.js"(exports2, module2) {
    module2.exports = which;
    which.sync = whichSync;
    var isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
    var path11 = require("path");
    var COLON = isWindows ? ";" : ":";
    var isexe = require_isexe();
    function getNotFoundError(cmd) {
      var er = new Error("not found: " + cmd);
      er.code = "ENOENT";
      return er;
    }
    function getPathInfo(cmd, opt) {
      var colon = opt.colon || COLON;
      var pathEnv = opt.path || process.env.PATH || "";
      var pathExt = [""];
      pathEnv = pathEnv.split(colon);
      var pathExtExe = "";
      if (isWindows) {
        pathEnv.unshift(process.cwd());
        pathExtExe = opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM";
        pathExt = pathExtExe.split(colon);
        if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
          pathExt.unshift("");
      }
      if (cmd.match(/\//) || isWindows && cmd.match(/\\/))
        pathEnv = [""];
      return {
        env: pathEnv,
        ext: pathExt,
        extExe: pathExtExe
      };
    }
    function which(cmd, opt, cb) {
      if (typeof opt === "function") {
        cb = opt;
        opt = {};
      }
      var info = getPathInfo(cmd, opt);
      var pathEnv = info.env;
      var pathExt = info.ext;
      var pathExtExe = info.extExe;
      var found = [];
      (function F(i, l) {
        if (i === l) {
          if (opt.all && found.length)
            return cb(null, found);
          else
            return cb(getNotFoundError(cmd));
        }
        var pathPart = pathEnv[i];
        if (pathPart.charAt(0) === '"' && pathPart.slice(-1) === '"')
          pathPart = pathPart.slice(1, -1);
        var p = path11.join(pathPart, cmd);
        if (!pathPart && /^\.[\\\/]/.test(cmd)) {
          p = cmd.slice(0, 2) + p;
        }
        ;
        (function E(ii, ll) {
          if (ii === ll) return F(i + 1, l);
          var ext = pathExt[ii];
          isexe(p + ext, { pathExt: pathExtExe }, function(er, is) {
            if (!er && is) {
              if (opt.all)
                found.push(p + ext);
              else
                return cb(null, p + ext);
            }
            return E(ii + 1, ll);
          });
        })(0, pathExt.length);
      })(0, pathEnv.length);
    }
    function whichSync(cmd, opt) {
      opt = opt || {};
      var info = getPathInfo(cmd, opt);
      var pathEnv = info.env;
      var pathExt = info.ext;
      var pathExtExe = info.extExe;
      var found = [];
      for (var i = 0, l = pathEnv.length; i < l; i++) {
        var pathPart = pathEnv[i];
        if (pathPart.charAt(0) === '"' && pathPart.slice(-1) === '"')
          pathPart = pathPart.slice(1, -1);
        var p = path11.join(pathPart, cmd);
        if (!pathPart && /^\.[\\\/]/.test(cmd)) {
          p = cmd.slice(0, 2) + p;
        }
        for (var j = 0, ll = pathExt.length; j < ll; j++) {
          var cur = p + pathExt[j];
          var is;
          try {
            is = isexe.sync(cur, { pathExt: pathExtExe });
            if (is) {
              if (opt.all)
                found.push(cur);
              else
                return cur;
            }
          } catch (ex) {
          }
        }
      }
      if (opt.all && found.length)
        return found;
      if (opt.nothrow)
        return null;
      throw getNotFoundError(cmd);
    }
  }
});

// node_modules/fluent-ffmpeg/lib/utils.js
var require_utils = __commonJS({
  "node_modules/fluent-ffmpeg/lib/utils.js"(exports2, module2) {
    "use strict";
    var exec = require("child_process").exec;
    var isWindows = require("os").platform().match(/win(32|64)/);
    var which = require_which();
    var nlRegexp = /\r\n|\r|\n/g;
    var streamRegexp = /^\[?(.*?)\]?$/;
    var filterEscapeRegexp = /[,]/;
    var whichCache = {};
    function parseProgressLine(line) {
      var progress = {};
      line = line.replace(/=\s+/g, "=").trim();
      var progressParts = line.split(" ");
      for (var i = 0; i < progressParts.length; i++) {
        var progressSplit = progressParts[i].split("=", 2);
        var key = progressSplit[0];
        var value = progressSplit[1];
        if (typeof value === "undefined")
          return null;
        progress[key] = value;
      }
      return progress;
    }
    var utils = module2.exports = {
      isWindows,
      streamRegexp,
      /**
       * Copy an object keys into another one
       *
       * @param {Object} source source object
       * @param {Object} dest destination object
       * @private
       */
      copy: function(source, dest) {
        Object.keys(source).forEach(function(key) {
          dest[key] = source[key];
        });
      },
      /**
       * Create an argument list
       *
       * Returns a function that adds new arguments to the list.
       * It also has the following methods:
       * - clear() empties the argument list
       * - get() returns the argument list
       * - find(arg, count) finds 'arg' in the list and return the following 'count' items, or undefined if not found
       * - remove(arg, count) remove 'arg' in the list as well as the following 'count' items
       *
       * @private
       */
      args: function() {
        var list = [];
        var argfunc = function() {
          if (arguments.length === 1 && Array.isArray(arguments[0])) {
            list = list.concat(arguments[0]);
          } else {
            list = list.concat([].slice.call(arguments));
          }
        };
        argfunc.clear = function() {
          list = [];
        };
        argfunc.get = function() {
          return list;
        };
        argfunc.find = function(arg, count) {
          var index = list.indexOf(arg);
          if (index !== -1) {
            return list.slice(index + 1, index + 1 + (count || 0));
          }
        };
        argfunc.remove = function(arg, count) {
          var index = list.indexOf(arg);
          if (index !== -1) {
            list.splice(index, (count || 0) + 1);
          }
        };
        argfunc.clone = function() {
          var cloned = utils.args();
          cloned(list);
          return cloned;
        };
        return argfunc;
      },
      /**
       * Generate filter strings
       *
       * @param {String[]|Object[]} filters filter specifications. When using objects,
       *   each must have the following properties:
       * @param {String} filters.filter filter name
       * @param {String|Array} [filters.inputs] (array of) input stream specifier(s) for the filter,
       *   defaults to ffmpeg automatically choosing the first unused matching streams
       * @param {String|Array} [filters.outputs] (array of) output stream specifier(s) for the filter,
       *   defaults to ffmpeg automatically assigning the output to the output file
       * @param {Object|String|Array} [filters.options] filter options, can be omitted to not set any options
       * @return String[]
       * @private
       */
      makeFilterStrings: function(filters) {
        return filters.map(function(filterSpec) {
          if (typeof filterSpec === "string") {
            return filterSpec;
          }
          var filterString = "";
          if (Array.isArray(filterSpec.inputs)) {
            filterString += filterSpec.inputs.map(function(streamSpec) {
              return streamSpec.replace(streamRegexp, "[$1]");
            }).join("");
          } else if (typeof filterSpec.inputs === "string") {
            filterString += filterSpec.inputs.replace(streamRegexp, "[$1]");
          }
          filterString += filterSpec.filter;
          if (filterSpec.options) {
            if (typeof filterSpec.options === "string" || typeof filterSpec.options === "number") {
              filterString += "=" + filterSpec.options;
            } else if (Array.isArray(filterSpec.options)) {
              filterString += "=" + filterSpec.options.map(function(option) {
                if (typeof option === "string" && option.match(filterEscapeRegexp)) {
                  return "'" + option + "'";
                } else {
                  return option;
                }
              }).join(":");
            } else if (Object.keys(filterSpec.options).length) {
              filterString += "=" + Object.keys(filterSpec.options).map(function(option) {
                var value = filterSpec.options[option];
                if (typeof value === "string" && value.match(filterEscapeRegexp)) {
                  value = "'" + value + "'";
                }
                return option + "=" + value;
              }).join(":");
            }
          }
          if (Array.isArray(filterSpec.outputs)) {
            filterString += filterSpec.outputs.map(function(streamSpec) {
              return streamSpec.replace(streamRegexp, "[$1]");
            }).join("");
          } else if (typeof filterSpec.outputs === "string") {
            filterString += filterSpec.outputs.replace(streamRegexp, "[$1]");
          }
          return filterString;
        });
      },
      /**
       * Search for an executable
       *
       * Uses 'which' or 'where' depending on platform
       *
       * @param {String} name executable name
       * @param {Function} callback callback with signature (err, path)
       * @private
       */
      which: function(name, callback) {
        if (name in whichCache) {
          return callback(null, whichCache[name]);
        }
        which(name, function(err, result) {
          if (err) {
            return callback(null, whichCache[name] = "");
          }
          callback(null, whichCache[name] = result);
        });
      },
      /**
       * Convert a [[hh:]mm:]ss[.xxx] timemark into seconds
       *
       * @param {String} timemark timemark string
       * @return Number
       * @private
       */
      timemarkToSeconds: function(timemark) {
        if (typeof timemark === "number") {
          return timemark;
        }
        if (timemark.indexOf(":") === -1 && timemark.indexOf(".") >= 0) {
          return Number(timemark);
        }
        var parts = timemark.split(":");
        var secs = Number(parts.pop());
        if (parts.length) {
          secs += Number(parts.pop()) * 60;
        }
        if (parts.length) {
          secs += Number(parts.pop()) * 3600;
        }
        return secs;
      },
      /**
       * Extract codec data from ffmpeg stderr and emit 'codecData' event if appropriate
       * Call it with an initially empty codec object once with each line of stderr output until it returns true
       *
       * @param {FfmpegCommand} command event emitter
       * @param {String} stderrLine ffmpeg stderr output line
       * @param {Object} codecObject object used to accumulate codec data between calls
       * @return {Boolean} true if codec data is complete (and event was emitted), false otherwise
       * @private
       */
      extractCodecData: function(command, stderrLine, codecsObject) {
        var inputPattern = /Input #[0-9]+, ([^ ]+),/;
        var durPattern = /Duration\: ([^,]+)/;
        var audioPattern = /Audio\: (.*)/;
        var videoPattern = /Video\: (.*)/;
        if (!("inputStack" in codecsObject)) {
          codecsObject.inputStack = [];
          codecsObject.inputIndex = -1;
          codecsObject.inInput = false;
        }
        var inputStack = codecsObject.inputStack;
        var inputIndex = codecsObject.inputIndex;
        var inInput = codecsObject.inInput;
        var format, dur, audio, video;
        if (format = stderrLine.match(inputPattern)) {
          inInput = codecsObject.inInput = true;
          inputIndex = codecsObject.inputIndex = codecsObject.inputIndex + 1;
          inputStack[inputIndex] = { format: format[1], audio: "", video: "", duration: "" };
        } else if (inInput && (dur = stderrLine.match(durPattern))) {
          inputStack[inputIndex].duration = dur[1];
        } else if (inInput && (audio = stderrLine.match(audioPattern))) {
          audio = audio[1].split(", ");
          inputStack[inputIndex].audio = audio[0];
          inputStack[inputIndex].audio_details = audio;
        } else if (inInput && (video = stderrLine.match(videoPattern))) {
          video = video[1].split(", ");
          inputStack[inputIndex].video = video[0];
          inputStack[inputIndex].video_details = video;
        } else if (/Output #\d+/.test(stderrLine)) {
          inInput = codecsObject.inInput = false;
        } else if (/Stream mapping:|Press (\[q\]|ctrl-c) to stop/.test(stderrLine)) {
          command.emit.apply(command, ["codecData"].concat(inputStack));
          return true;
        }
        return false;
      },
      /**
       * Extract progress data from ffmpeg stderr and emit 'progress' event if appropriate
       *
       * @param {FfmpegCommand} command event emitter
       * @param {String} stderrLine ffmpeg stderr data
       * @private
       */
      extractProgress: function(command, stderrLine) {
        var progress = parseProgressLine(stderrLine);
        if (progress) {
          var ret = {
            frames: parseInt(progress.frame, 10),
            currentFps: parseInt(progress.fps, 10),
            currentKbps: progress.bitrate ? parseFloat(progress.bitrate.replace("kbits/s", "")) : 0,
            targetSize: parseInt(progress.size || progress.Lsize, 10),
            timemark: progress.time
          };
          if (command._ffprobeData && command._ffprobeData.format && command._ffprobeData.format.duration) {
            var duration = Number(command._ffprobeData.format.duration);
            if (!isNaN(duration))
              ret.percent = utils.timemarkToSeconds(ret.timemark) / duration * 100;
          }
          command.emit("progress", ret);
        }
      },
      /**
       * Extract error message(s) from ffmpeg stderr
       *
       * @param {String} stderr ffmpeg stderr data
       * @return {String}
       * @private
       */
      extractError: function(stderr) {
        return stderr.split(nlRegexp).reduce(function(messages, message) {
          if (message.charAt(0) === " " || message.charAt(0) === "[") {
            return [];
          } else {
            messages.push(message);
            return messages;
          }
        }, []).join("\n");
      },
      /**
       * Creates a line ring buffer object with the following methods:
       * - append(str) : appends a string or buffer
       * - get() : returns the whole string
       * - close() : prevents further append() calls and does a last call to callbacks
       * - callback(cb) : calls cb for each line (incl. those already in the ring)
       *
       * @param {Number} maxLines maximum number of lines to store (<= 0 for unlimited)
       */
      linesRing: function(maxLines) {
        var cbs = [];
        var lines = [];
        var current = null;
        var closed = false;
        var max = maxLines - 1;
        function emit(line) {
          cbs.forEach(function(cb) {
            cb(line);
          });
        }
        return {
          callback: function(cb) {
            lines.forEach(function(l) {
              cb(l);
            });
            cbs.push(cb);
          },
          append: function(str) {
            if (closed) return;
            if (str instanceof Buffer) str = "" + str;
            if (!str || str.length === 0) return;
            var newLines = str.split(nlRegexp);
            if (newLines.length === 1) {
              if (current !== null) {
                current = current + newLines.shift();
              } else {
                current = newLines.shift();
              }
            } else {
              if (current !== null) {
                current = current + newLines.shift();
                emit(current);
                lines.push(current);
              }
              current = newLines.pop();
              newLines.forEach(function(l) {
                emit(l);
                lines.push(l);
              });
              if (max > -1 && lines.length > max) {
                lines.splice(0, lines.length - max);
              }
            }
          },
          get: function() {
            if (current !== null) {
              return lines.concat([current]).join("\n");
            } else {
              return lines.join("\n");
            }
          },
          close: function() {
            if (closed) return;
            if (current !== null) {
              emit(current);
              lines.push(current);
              if (max > -1 && lines.length > max) {
                lines.shift();
              }
              current = null;
            }
            closed = true;
          }
        };
      }
    };
  }
});

// node_modules/fluent-ffmpeg/lib/options/inputs.js
var require_inputs = __commonJS({
  "node_modules/fluent-ffmpeg/lib/options/inputs.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    module2.exports = function(proto) {
      proto.mergeAdd = proto.addInput = proto.input = function(source) {
        var isFile = false;
        var isStream = false;
        if (typeof source !== "string") {
          if (!("readable" in source) || !source.readable) {
            throw new Error("Invalid input");
          }
          var hasInputStream = this._inputs.some(function(input) {
            return input.isStream;
          });
          if (hasInputStream) {
            throw new Error("Only one input stream is supported");
          }
          isStream = true;
          source.pause();
        } else {
          var protocol2 = source.match(/^([a-z]{2,}):/i);
          isFile = !protocol2 || protocol2[0] === "file";
        }
        this._inputs.push(this._currentInput = {
          source,
          isFile,
          isStream,
          options: utils.args()
        });
        return this;
      };
      proto.withInputFormat = proto.inputFormat = proto.fromFormat = function(format) {
        if (!this._currentInput) {
          throw new Error("No input specified");
        }
        this._currentInput.options("-f", format);
        return this;
      };
      proto.withInputFps = proto.withInputFPS = proto.withFpsInput = proto.withFPSInput = proto.inputFPS = proto.inputFps = proto.fpsInput = proto.FPSInput = function(fps) {
        if (!this._currentInput) {
          throw new Error("No input specified");
        }
        this._currentInput.options("-r", fps);
        return this;
      };
      proto.nativeFramerate = proto.withNativeFramerate = proto.native = function() {
        if (!this._currentInput) {
          throw new Error("No input specified");
        }
        this._currentInput.options("-re");
        return this;
      };
      proto.setStartTime = proto.seekInput = function(seek) {
        if (!this._currentInput) {
          throw new Error("No input specified");
        }
        this._currentInput.options("-ss", seek);
        return this;
      };
      proto.loop = function(duration) {
        if (!this._currentInput) {
          throw new Error("No input specified");
        }
        this._currentInput.options("-loop", "1");
        if (typeof duration !== "undefined") {
          this.duration(duration);
        }
        return this;
      };
    };
  }
});

// node_modules/fluent-ffmpeg/lib/options/audio.js
var require_audio = __commonJS({
  "node_modules/fluent-ffmpeg/lib/options/audio.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    module2.exports = function(proto) {
      proto.withNoAudio = proto.noAudio = function() {
        this._currentOutput.audio.clear();
        this._currentOutput.audioFilters.clear();
        this._currentOutput.audio("-an");
        return this;
      };
      proto.withAudioCodec = proto.audioCodec = function(codec) {
        this._currentOutput.audio("-acodec", codec);
        return this;
      };
      proto.withAudioBitrate = proto.audioBitrate = function(bitrate) {
        this._currentOutput.audio("-b:a", ("" + bitrate).replace(/k?$/, "k"));
        return this;
      };
      proto.withAudioChannels = proto.audioChannels = function(channels) {
        this._currentOutput.audio("-ac", channels);
        return this;
      };
      proto.withAudioFrequency = proto.audioFrequency = function(freq) {
        this._currentOutput.audio("-ar", freq);
        return this;
      };
      proto.withAudioQuality = proto.audioQuality = function(quality) {
        this._currentOutput.audio("-aq", quality);
        return this;
      };
      proto.withAudioFilter = proto.withAudioFilters = proto.audioFilter = proto.audioFilters = function(filters) {
        if (arguments.length > 1) {
          filters = [].slice.call(arguments);
        }
        if (!Array.isArray(filters)) {
          filters = [filters];
        }
        this._currentOutput.audioFilters(utils.makeFilterStrings(filters));
        return this;
      };
    };
  }
});

// node_modules/fluent-ffmpeg/lib/options/video.js
var require_video = __commonJS({
  "node_modules/fluent-ffmpeg/lib/options/video.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    module2.exports = function(proto) {
      proto.withNoVideo = proto.noVideo = function() {
        this._currentOutput.video.clear();
        this._currentOutput.videoFilters.clear();
        this._currentOutput.video("-vn");
        return this;
      };
      proto.withVideoCodec = proto.videoCodec = function(codec) {
        this._currentOutput.video("-vcodec", codec);
        return this;
      };
      proto.withVideoBitrate = proto.videoBitrate = function(bitrate, constant) {
        bitrate = ("" + bitrate).replace(/k?$/, "k");
        this._currentOutput.video("-b:v", bitrate);
        if (constant) {
          this._currentOutput.video(
            "-maxrate",
            bitrate,
            "-minrate",
            bitrate,
            "-bufsize",
            "3M"
          );
        }
        return this;
      };
      proto.withVideoFilter = proto.withVideoFilters = proto.videoFilter = proto.videoFilters = function(filters) {
        if (arguments.length > 1) {
          filters = [].slice.call(arguments);
        }
        if (!Array.isArray(filters)) {
          filters = [filters];
        }
        this._currentOutput.videoFilters(utils.makeFilterStrings(filters));
        return this;
      };
      proto.withOutputFps = proto.withOutputFPS = proto.withFpsOutput = proto.withFPSOutput = proto.withFps = proto.withFPS = proto.outputFPS = proto.outputFps = proto.fpsOutput = proto.FPSOutput = proto.fps = proto.FPS = function(fps) {
        this._currentOutput.video("-r", fps);
        return this;
      };
      proto.takeFrames = proto.withFrames = proto.frames = function(frames) {
        this._currentOutput.video("-vframes", frames);
        return this;
      };
    };
  }
});

// node_modules/fluent-ffmpeg/lib/options/videosize.js
var require_videosize = __commonJS({
  "node_modules/fluent-ffmpeg/lib/options/videosize.js"(exports2, module2) {
    "use strict";
    function getScalePadFilters(width, height, aspect, color) {
      return [
        /*
          In both cases, we first have to scale the input to match the requested size.
          When using computed width/height, we truncate them to multiples of 2
         */
        {
          filter: "scale",
          options: {
            w: "if(gt(a," + aspect + ")," + width + ",trunc(" + height + "*a/2)*2)",
            h: "if(lt(a," + aspect + ")," + height + ",trunc(" + width + "/a/2)*2)"
          }
        },
        /*
          Then we pad the scaled input to match the target size
          (here iw and ih refer to the padding input, i.e the scaled output)
         */
        {
          filter: "pad",
          options: {
            w: width,
            h: height,
            x: "if(gt(a," + aspect + "),0,(" + width + "-iw)/2)",
            y: "if(lt(a," + aspect + "),0,(" + height + "-ih)/2)",
            color
          }
        }
      ];
    }
    function createSizeFilters(output, key, value) {
      var data = output.sizeData = output.sizeData || {};
      data[key] = value;
      if (!("size" in data)) {
        return [];
      }
      var fixedSize = data.size.match(/([0-9]+)x([0-9]+)/);
      var fixedWidth = data.size.match(/([0-9]+)x\?/);
      var fixedHeight = data.size.match(/\?x([0-9]+)/);
      var percentRatio = data.size.match(/\b([0-9]{1,3})%/);
      var width, height, aspect;
      if (percentRatio) {
        var ratio = Number(percentRatio[1]) / 100;
        return [{
          filter: "scale",
          options: {
            w: "trunc(iw*" + ratio + "/2)*2",
            h: "trunc(ih*" + ratio + "/2)*2"
          }
        }];
      } else if (fixedSize) {
        width = Math.round(Number(fixedSize[1]) / 2) * 2;
        height = Math.round(Number(fixedSize[2]) / 2) * 2;
        aspect = width / height;
        if (data.pad) {
          return getScalePadFilters(width, height, aspect, data.pad);
        } else {
          return [{ filter: "scale", options: { w: width, h: height } }];
        }
      } else if (fixedWidth || fixedHeight) {
        if ("aspect" in data) {
          width = fixedWidth ? fixedWidth[1] : Math.round(Number(fixedHeight[1]) * data.aspect);
          height = fixedHeight ? fixedHeight[1] : Math.round(Number(fixedWidth[1]) / data.aspect);
          width = Math.round(width / 2) * 2;
          height = Math.round(height / 2) * 2;
          if (data.pad) {
            return getScalePadFilters(width, height, data.aspect, data.pad);
          } else {
            return [{ filter: "scale", options: { w: width, h: height } }];
          }
        } else {
          if (fixedWidth) {
            return [{
              filter: "scale",
              options: {
                w: Math.round(Number(fixedWidth[1]) / 2) * 2,
                h: "trunc(ow/a/2)*2"
              }
            }];
          } else {
            return [{
              filter: "scale",
              options: {
                w: "trunc(oh*a/2)*2",
                h: Math.round(Number(fixedHeight[1]) / 2) * 2
              }
            }];
          }
        }
      } else {
        throw new Error("Invalid size specified: " + data.size);
      }
    }
    module2.exports = function(proto) {
      proto.keepPixelAspect = // Only for compatibility, this is not about keeping _pixel_ aspect ratio
      proto.keepDisplayAspect = proto.keepDisplayAspectRatio = proto.keepDAR = function() {
        return this.videoFilters([
          {
            filter: "scale",
            options: {
              w: "if(gt(sar,1),iw*sar,iw)",
              h: "if(lt(sar,1),ih/sar,ih)"
            }
          },
          {
            filter: "setsar",
            options: "1"
          }
        ]);
      };
      proto.withSize = proto.setSize = proto.size = function(size) {
        var filters = createSizeFilters(this._currentOutput, "size", size);
        this._currentOutput.sizeFilters.clear();
        this._currentOutput.sizeFilters(filters);
        return this;
      };
      proto.withAspect = proto.withAspectRatio = proto.setAspect = proto.setAspectRatio = proto.aspect = proto.aspectRatio = function(aspect) {
        var a = Number(aspect);
        if (isNaN(a)) {
          var match = aspect.match(/^(\d+):(\d+)$/);
          if (match) {
            a = Number(match[1]) / Number(match[2]);
          } else {
            throw new Error("Invalid aspect ratio: " + aspect);
          }
        }
        var filters = createSizeFilters(this._currentOutput, "aspect", a);
        this._currentOutput.sizeFilters.clear();
        this._currentOutput.sizeFilters(filters);
        return this;
      };
      proto.applyAutopadding = proto.applyAutoPadding = proto.applyAutopad = proto.applyAutoPad = proto.withAutopadding = proto.withAutoPadding = proto.withAutopad = proto.withAutoPad = proto.autoPad = proto.autopad = function(pad, color) {
        if (typeof pad === "string") {
          color = pad;
          pad = true;
        }
        if (typeof pad === "undefined") {
          pad = true;
        }
        var filters = createSizeFilters(this._currentOutput, "pad", pad ? color || "black" : false);
        this._currentOutput.sizeFilters.clear();
        this._currentOutput.sizeFilters(filters);
        return this;
      };
    };
  }
});

// node_modules/fluent-ffmpeg/lib/options/output.js
var require_output = __commonJS({
  "node_modules/fluent-ffmpeg/lib/options/output.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    module2.exports = function(proto) {
      proto.addOutput = proto.output = function(target, pipeopts) {
        var isFile = false;
        if (!target && this._currentOutput) {
          throw new Error("Invalid output");
        }
        if (target && typeof target !== "string") {
          if (!("writable" in target) || !target.writable) {
            throw new Error("Invalid output");
          }
        } else if (typeof target === "string") {
          var protocol2 = target.match(/^([a-z]{2,}):/i);
          isFile = !protocol2 || protocol2[0] === "file";
        }
        if (target && !("target" in this._currentOutput)) {
          this._currentOutput.target = target;
          this._currentOutput.isFile = isFile;
          this._currentOutput.pipeopts = pipeopts || {};
        } else {
          if (target && typeof target !== "string") {
            var hasOutputStream = this._outputs.some(function(output) {
              return typeof output.target !== "string";
            });
            if (hasOutputStream) {
              throw new Error("Only one output stream is supported");
            }
          }
          this._outputs.push(this._currentOutput = {
            target,
            isFile,
            flags: {},
            pipeopts: pipeopts || {}
          });
          var self = this;
          ["audio", "audioFilters", "video", "videoFilters", "sizeFilters", "options"].forEach(function(key) {
            self._currentOutput[key] = utils.args();
          });
          if (!target) {
            delete this._currentOutput.target;
          }
        }
        return this;
      };
      proto.seekOutput = proto.seek = function(seek) {
        this._currentOutput.options("-ss", seek);
        return this;
      };
      proto.withDuration = proto.setDuration = proto.duration = function(duration) {
        this._currentOutput.options("-t", duration);
        return this;
      };
      proto.toFormat = proto.withOutputFormat = proto.outputFormat = proto.format = function(format) {
        this._currentOutput.options("-f", format);
        return this;
      };
      proto.map = function(spec) {
        this._currentOutput.options("-map", spec.replace(utils.streamRegexp, "[$1]"));
        return this;
      };
      proto.updateFlvMetadata = proto.flvmeta = function() {
        this._currentOutput.flags.flvmeta = true;
        return this;
      };
    };
  }
});

// node_modules/fluent-ffmpeg/lib/options/custom.js
var require_custom = __commonJS({
  "node_modules/fluent-ffmpeg/lib/options/custom.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    module2.exports = function(proto) {
      proto.addInputOption = proto.addInputOptions = proto.withInputOption = proto.withInputOptions = proto.inputOption = proto.inputOptions = function(options) {
        if (!this._currentInput) {
          throw new Error("No input specified");
        }
        var doSplit = true;
        if (arguments.length > 1) {
          options = [].slice.call(arguments);
          doSplit = false;
        }
        if (!Array.isArray(options)) {
          options = [options];
        }
        this._currentInput.options(options.reduce(function(options2, option) {
          var split = String(option).split(" ");
          if (doSplit && split.length === 2) {
            options2.push(split[0], split[1]);
          } else {
            options2.push(option);
          }
          return options2;
        }, []));
        return this;
      };
      proto.addOutputOption = proto.addOutputOptions = proto.addOption = proto.addOptions = proto.withOutputOption = proto.withOutputOptions = proto.withOption = proto.withOptions = proto.outputOption = proto.outputOptions = function(options) {
        var doSplit = true;
        if (arguments.length > 1) {
          options = [].slice.call(arguments);
          doSplit = false;
        }
        if (!Array.isArray(options)) {
          options = [options];
        }
        this._currentOutput.options(options.reduce(function(options2, option) {
          var split = String(option).split(" ");
          if (doSplit && split.length === 2) {
            options2.push(split[0], split[1]);
          } else {
            options2.push(option);
          }
          return options2;
        }, []));
        return this;
      };
      proto.filterGraph = proto.complexFilter = function(spec, map) {
        this._complexFilters.clear();
        if (!Array.isArray(spec)) {
          spec = [spec];
        }
        this._complexFilters("-filter_complex", utils.makeFilterStrings(spec).join(";"));
        if (Array.isArray(map)) {
          var self = this;
          map.forEach(function(streamSpec) {
            self._complexFilters("-map", streamSpec.replace(utils.streamRegexp, "[$1]"));
          });
        } else if (typeof map === "string") {
          this._complexFilters("-map", map.replace(utils.streamRegexp, "[$1]"));
        }
        return this;
      };
    };
  }
});

// node_modules/fluent-ffmpeg/lib/options/misc.js
var require_misc = __commonJS({
  "node_modules/fluent-ffmpeg/lib/options/misc.js"(exports2, module2) {
    "use strict";
    var path11 = require("path");
    module2.exports = function(proto) {
      proto.usingPreset = proto.preset = function(preset) {
        if (typeof preset === "function") {
          preset(this);
        } else {
          try {
            var modulePath = path11.join(this.options.presets, preset);
            var module3 = require(modulePath);
            if (typeof module3.load === "function") {
              module3.load(this);
            } else {
              throw new Error("preset " + modulePath + " has no load() function");
            }
          } catch (err) {
            throw new Error("preset " + modulePath + " could not be loaded: " + err.message);
          }
        }
        return this;
      };
    };
  }
});

// node_modules/fluent-ffmpeg/node_modules/async/lib/async.js
var require_async = __commonJS({
  "node_modules/fluent-ffmpeg/node_modules/async/lib/async.js"(exports2, module2) {
    (function() {
      var async = {};
      var root, previous_async;
      root = this;
      if (root != null) {
        previous_async = root.async;
      }
      async.noConflict = function() {
        root.async = previous_async;
        return async;
      };
      function only_once(fn) {
        var called = false;
        return function() {
          if (called) throw new Error("Callback was already called.");
          called = true;
          fn.apply(root, arguments);
        };
      }
      var _each = function(arr, iterator) {
        if (arr.forEach) {
          return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
          iterator(arr[i], i, arr);
        }
      };
      var _map = function(arr, iterator) {
        if (arr.map) {
          return arr.map(iterator);
        }
        var results = [];
        _each(arr, function(x, i, a) {
          results.push(iterator(x, i, a));
        });
        return results;
      };
      var _reduce = function(arr, iterator, memo) {
        if (arr.reduce) {
          return arr.reduce(iterator, memo);
        }
        _each(arr, function(x, i, a) {
          memo = iterator(memo, x, i, a);
        });
        return memo;
      };
      var _keys = function(obj) {
        if (Object.keys) {
          return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
          if (obj.hasOwnProperty(k)) {
            keys.push(k);
          }
        }
        return keys;
      };
      if (typeof process === "undefined" || !process.nextTick) {
        if (typeof setImmediate === "function") {
          async.nextTick = function(fn) {
            setImmediate(fn);
          };
          async.setImmediate = async.nextTick;
        } else {
          async.nextTick = function(fn) {
            setTimeout(fn, 0);
          };
          async.setImmediate = async.nextTick;
        }
      } else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== "undefined") {
          async.setImmediate = function(fn) {
            setImmediate(fn);
          };
        } else {
          async.setImmediate = async.nextTick;
        }
      }
      async.each = function(arr, iterator, callback) {
        callback = callback || function() {
        };
        if (!arr.length) {
          return callback();
        }
        var completed = 0;
        _each(arr, function(x) {
          iterator(x, only_once(function(err) {
            if (err) {
              callback(err);
              callback = function() {
              };
            } else {
              completed += 1;
              if (completed >= arr.length) {
                callback(null);
              }
            }
          }));
        });
      };
      async.forEach = async.each;
      async.eachSeries = function(arr, iterator, callback) {
        callback = callback || function() {
        };
        if (!arr.length) {
          return callback();
        }
        var completed = 0;
        var iterate = function() {
          iterator(arr[completed], function(err) {
            if (err) {
              callback(err);
              callback = function() {
              };
            } else {
              completed += 1;
              if (completed >= arr.length) {
                callback(null);
              } else {
                iterate();
              }
            }
          });
        };
        iterate();
      };
      async.forEachSeries = async.eachSeries;
      async.eachLimit = function(arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
      };
      async.forEachLimit = async.eachLimit;
      var _eachLimit = function(limit) {
        return function(arr, iterator, callback) {
          callback = callback || function() {
          };
          if (!arr.length || limit <= 0) {
            return callback();
          }
          var completed = 0;
          var started = 0;
          var running = 0;
          (function replenish() {
            if (completed >= arr.length) {
              return callback();
            }
            while (running < limit && started < arr.length) {
              started += 1;
              running += 1;
              iterator(arr[started - 1], function(err) {
                if (err) {
                  callback(err);
                  callback = function() {
                  };
                } else {
                  completed += 1;
                  running -= 1;
                  if (completed >= arr.length) {
                    callback();
                  } else {
                    replenish();
                  }
                }
              });
            }
          })();
        };
      };
      var doParallel = function(fn) {
        return function() {
          var args = Array.prototype.slice.call(arguments);
          return fn.apply(null, [async.each].concat(args));
        };
      };
      var doParallelLimit = function(limit, fn) {
        return function() {
          var args = Array.prototype.slice.call(arguments);
          return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
      };
      var doSeries = function(fn) {
        return function() {
          var args = Array.prototype.slice.call(arguments);
          return fn.apply(null, [async.eachSeries].concat(args));
        };
      };
      var _asyncMap = function(eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function(x, i) {
          return { index: i, value: x };
        });
        eachfn(arr, function(x, callback2) {
          iterator(x.value, function(err, v) {
            results[x.index] = v;
            callback2(err);
          });
        }, function(err) {
          callback(err, results);
        });
      };
      async.map = doParallel(_asyncMap);
      async.mapSeries = doSeries(_asyncMap);
      async.mapLimit = function(arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
      };
      var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
      };
      async.reduce = function(arr, memo, iterator, callback) {
        async.eachSeries(arr, function(x, callback2) {
          iterator(memo, x, function(err, v) {
            memo = v;
            callback2(err);
          });
        }, function(err) {
          callback(err, memo);
        });
      };
      async.inject = async.reduce;
      async.foldl = async.reduce;
      async.reduceRight = function(arr, memo, iterator, callback) {
        var reversed = _map(arr, function(x) {
          return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
      };
      async.foldr = async.reduceRight;
      var _filter = function(eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function(x, i) {
          return { index: i, value: x };
        });
        eachfn(arr, function(x, callback2) {
          iterator(x.value, function(v) {
            if (v) {
              results.push(x);
            }
            callback2();
          });
        }, function(err) {
          callback(_map(results.sort(function(a, b) {
            return a.index - b.index;
          }), function(x) {
            return x.value;
          }));
        });
      };
      async.filter = doParallel(_filter);
      async.filterSeries = doSeries(_filter);
      async.select = async.filter;
      async.selectSeries = async.filterSeries;
      var _reject = function(eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function(x, i) {
          return { index: i, value: x };
        });
        eachfn(arr, function(x, callback2) {
          iterator(x.value, function(v) {
            if (!v) {
              results.push(x);
            }
            callback2();
          });
        }, function(err) {
          callback(_map(results.sort(function(a, b) {
            return a.index - b.index;
          }), function(x) {
            return x.value;
          }));
        });
      };
      async.reject = doParallel(_reject);
      async.rejectSeries = doSeries(_reject);
      var _detect = function(eachfn, arr, iterator, main_callback) {
        eachfn(arr, function(x, callback) {
          iterator(x, function(result) {
            if (result) {
              main_callback(x);
              main_callback = function() {
              };
            } else {
              callback();
            }
          });
        }, function(err) {
          main_callback();
        });
      };
      async.detect = doParallel(_detect);
      async.detectSeries = doSeries(_detect);
      async.some = function(arr, iterator, main_callback) {
        async.each(arr, function(x, callback) {
          iterator(x, function(v) {
            if (v) {
              main_callback(true);
              main_callback = function() {
              };
            }
            callback();
          });
        }, function(err) {
          main_callback(false);
        });
      };
      async.any = async.some;
      async.every = function(arr, iterator, main_callback) {
        async.each(arr, function(x, callback) {
          iterator(x, function(v) {
            if (!v) {
              main_callback(false);
              main_callback = function() {
              };
            }
            callback();
          });
        }, function(err) {
          main_callback(true);
        });
      };
      async.all = async.every;
      async.sortBy = function(arr, iterator, callback) {
        async.map(arr, function(x, callback2) {
          iterator(x, function(err, criteria) {
            if (err) {
              callback2(err);
            } else {
              callback2(null, { value: x, criteria });
            }
          });
        }, function(err, results) {
          if (err) {
            return callback(err);
          } else {
            var fn = function(left, right) {
              var a = left.criteria, b = right.criteria;
              return a < b ? -1 : a > b ? 1 : 0;
            };
            callback(null, _map(results.sort(fn), function(x) {
              return x.value;
            }));
          }
        });
      };
      async.auto = function(tasks, callback) {
        callback = callback || function() {
        };
        var keys = _keys(tasks);
        if (!keys.length) {
          return callback(null);
        }
        var results = {};
        var listeners = [];
        var addListener = function(fn) {
          listeners.unshift(fn);
        };
        var removeListener = function(fn) {
          for (var i = 0; i < listeners.length; i += 1) {
            if (listeners[i] === fn) {
              listeners.splice(i, 1);
              return;
            }
          }
        };
        var taskComplete = function() {
          _each(listeners.slice(0), function(fn) {
            fn();
          });
        };
        addListener(function() {
          if (_keys(results).length === keys.length) {
            callback(null, results);
            callback = function() {
            };
          }
        });
        _each(keys, function(k) {
          var task = tasks[k] instanceof Function ? [tasks[k]] : tasks[k];
          var taskCallback = function(err) {
            var args = Array.prototype.slice.call(arguments, 1);
            if (args.length <= 1) {
              args = args[0];
            }
            if (err) {
              var safeResults = {};
              _each(_keys(results), function(rkey) {
                safeResults[rkey] = results[rkey];
              });
              safeResults[k] = args;
              callback(err, safeResults);
              callback = function() {
              };
            } else {
              results[k] = args;
              async.setImmediate(taskComplete);
            }
          };
          var requires = task.slice(0, Math.abs(task.length - 1)) || [];
          var ready = function() {
            return _reduce(requires, function(a, x) {
              return a && results.hasOwnProperty(x);
            }, true) && !results.hasOwnProperty(k);
          };
          if (ready()) {
            task[task.length - 1](taskCallback, results);
          } else {
            var listener = function() {
              if (ready()) {
                removeListener(listener);
                task[task.length - 1](taskCallback, results);
              }
            };
            addListener(listener);
          }
        });
      };
      async.waterfall = function(tasks, callback) {
        callback = callback || function() {
        };
        if (tasks.constructor !== Array) {
          var err = new Error("First argument to waterfall must be an array of functions");
          return callback(err);
        }
        if (!tasks.length) {
          return callback();
        }
        var wrapIterator = function(iterator) {
          return function(err2) {
            if (err2) {
              callback.apply(null, arguments);
              callback = function() {
              };
            } else {
              var args = Array.prototype.slice.call(arguments, 1);
              var next = iterator.next();
              if (next) {
                args.push(wrapIterator(next));
              } else {
                args.push(callback);
              }
              async.setImmediate(function() {
                iterator.apply(null, args);
              });
            }
          };
        };
        wrapIterator(async.iterator(tasks))();
      };
      var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function() {
        };
        if (tasks.constructor === Array) {
          eachfn.map(tasks, function(fn, callback2) {
            if (fn) {
              fn(function(err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                  args = args[0];
                }
                callback2.call(null, err, args);
              });
            }
          }, callback);
        } else {
          var results = {};
          eachfn.each(_keys(tasks), function(k, callback2) {
            tasks[k](function(err) {
              var args = Array.prototype.slice.call(arguments, 1);
              if (args.length <= 1) {
                args = args[0];
              }
              results[k] = args;
              callback2(err);
            });
          }, function(err) {
            callback(err, results);
          });
        }
      };
      async.parallel = function(tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
      };
      async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
      };
      async.series = function(tasks, callback) {
        callback = callback || function() {
        };
        if (tasks.constructor === Array) {
          async.mapSeries(tasks, function(fn, callback2) {
            if (fn) {
              fn(function(err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                  args = args[0];
                }
                callback2.call(null, err, args);
              });
            }
          }, callback);
        } else {
          var results = {};
          async.eachSeries(_keys(tasks), function(k, callback2) {
            tasks[k](function(err) {
              var args = Array.prototype.slice.call(arguments, 1);
              if (args.length <= 1) {
                args = args[0];
              }
              results[k] = args;
              callback2(err);
            });
          }, function(err) {
            callback(err, results);
          });
        }
      };
      async.iterator = function(tasks) {
        var makeCallback = function(index) {
          var fn = function() {
            if (tasks.length) {
              tasks[index].apply(null, arguments);
            }
            return fn.next();
          };
          fn.next = function() {
            return index < tasks.length - 1 ? makeCallback(index + 1) : null;
          };
          return fn;
        };
        return makeCallback(0);
      };
      async.apply = function(fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function() {
          return fn.apply(
            null,
            args.concat(Array.prototype.slice.call(arguments))
          );
        };
      };
      var _concat = function(eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function(x, cb) {
          fn(x, function(err, y) {
            r = r.concat(y || []);
            cb(err);
          });
        }, function(err) {
          callback(err, r);
        });
      };
      async.concat = doParallel(_concat);
      async.concatSeries = doSeries(_concat);
      async.whilst = function(test, iterator, callback) {
        if (test()) {
          iterator(function(err) {
            if (err) {
              return callback(err);
            }
            async.whilst(test, iterator, callback);
          });
        } else {
          callback();
        }
      };
      async.doWhilst = function(iterator, test, callback) {
        iterator(function(err) {
          if (err) {
            return callback(err);
          }
          if (test()) {
            async.doWhilst(iterator, test, callback);
          } else {
            callback();
          }
        });
      };
      async.until = function(test, iterator, callback) {
        if (!test()) {
          iterator(function(err) {
            if (err) {
              return callback(err);
            }
            async.until(test, iterator, callback);
          });
        } else {
          callback();
        }
      };
      async.doUntil = function(iterator, test, callback) {
        iterator(function(err) {
          if (err) {
            return callback(err);
          }
          if (!test()) {
            async.doUntil(iterator, test, callback);
          } else {
            callback();
          }
        });
      };
      async.queue = function(worker, concurrency) {
        if (concurrency === void 0) {
          concurrency = 1;
        }
        function _insert(q2, data, pos, callback) {
          if (data.constructor !== Array) {
            data = [data];
          }
          _each(data, function(task) {
            var item = {
              data: task,
              callback: typeof callback === "function" ? callback : null
            };
            if (pos) {
              q2.tasks.unshift(item);
            } else {
              q2.tasks.push(item);
            }
            if (q2.saturated && q2.tasks.length === concurrency) {
              q2.saturated();
            }
            async.setImmediate(q2.process);
          });
        }
        var workers = 0;
        var q = {
          tasks: [],
          concurrency,
          saturated: null,
          empty: null,
          drain: null,
          push: function(data, callback) {
            _insert(q, data, false, callback);
          },
          unshift: function(data, callback) {
            _insert(q, data, true, callback);
          },
          process: function() {
            if (workers < q.concurrency && q.tasks.length) {
              var task = q.tasks.shift();
              if (q.empty && q.tasks.length === 0) {
                q.empty();
              }
              workers += 1;
              var next = function() {
                workers -= 1;
                if (task.callback) {
                  task.callback.apply(task, arguments);
                }
                if (q.drain && q.tasks.length + workers === 0) {
                  q.drain();
                }
                q.process();
              };
              var cb = only_once(next);
              worker(task.data, cb);
            }
          },
          length: function() {
            return q.tasks.length;
          },
          running: function() {
            return workers;
          }
        };
        return q;
      };
      async.cargo = function(worker, payload) {
        var working = false, tasks = [];
        var cargo = {
          tasks,
          payload,
          saturated: null,
          empty: null,
          drain: null,
          push: function(data, callback) {
            if (data.constructor !== Array) {
              data = [data];
            }
            _each(data, function(task) {
              tasks.push({
                data: task,
                callback: typeof callback === "function" ? callback : null
              });
              if (cargo.saturated && tasks.length === payload) {
                cargo.saturated();
              }
            });
            async.setImmediate(cargo.process);
          },
          process: function process2() {
            if (working) return;
            if (tasks.length === 0) {
              if (cargo.drain) cargo.drain();
              return;
            }
            var ts = typeof payload === "number" ? tasks.splice(0, payload) : tasks.splice(0);
            var ds = _map(ts, function(task) {
              return task.data;
            });
            if (cargo.empty) cargo.empty();
            working = true;
            worker(ds, function() {
              working = false;
              var args = arguments;
              _each(ts, function(data) {
                if (data.callback) {
                  data.callback.apply(null, args);
                }
              });
              process2();
            });
          },
          length: function() {
            return tasks.length;
          },
          running: function() {
            return working;
          }
        };
        return cargo;
      };
      var _console_fn = function(name) {
        return function(fn) {
          var args = Array.prototype.slice.call(arguments, 1);
          fn.apply(null, args.concat([function(err) {
            var args2 = Array.prototype.slice.call(arguments, 1);
            if (typeof console !== "undefined") {
              if (err) {
                if (console.error) {
                  console.error(err);
                }
              } else if (console[name]) {
                _each(args2, function(x) {
                  console[name](x);
                });
              }
            }
          }]));
        };
      };
      async.log = _console_fn("log");
      async.dir = _console_fn("dir");
      async.memoize = function(fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function(x) {
          return x;
        };
        var memoized = function() {
          var args = Array.prototype.slice.call(arguments);
          var callback = args.pop();
          var key = hasher.apply(null, args);
          if (key in memo) {
            callback.apply(null, memo[key]);
          } else if (key in queues) {
            queues[key].push(callback);
          } else {
            queues[key] = [callback];
            fn.apply(null, args.concat([function() {
              memo[key] = arguments;
              var q = queues[key];
              delete queues[key];
              for (var i = 0, l = q.length; i < l; i++) {
                q[i].apply(null, arguments);
              }
            }]));
          }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
      };
      async.unmemoize = function(fn) {
        return function() {
          return (fn.unmemoized || fn).apply(null, arguments);
        };
      };
      async.times = function(count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
          counter.push(i);
        }
        return async.map(counter, iterator, callback);
      };
      async.timesSeries = function(count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
          counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
      };
      async.compose = function() {
        var fns = Array.prototype.reverse.call(arguments);
        return function() {
          var that = this;
          var args = Array.prototype.slice.call(arguments);
          var callback = args.pop();
          async.reduce(
            fns,
            args,
            function(newargs, fn, cb) {
              fn.apply(that, newargs.concat([function() {
                var err = arguments[0];
                var nextargs = Array.prototype.slice.call(arguments, 1);
                cb(err, nextargs);
              }]));
            },
            function(err, results) {
              callback.apply(that, [err].concat(results));
            }
          );
        };
      };
      var _applyEach = function(eachfn, fns) {
        var go = function() {
          var that = this;
          var args2 = Array.prototype.slice.call(arguments);
          var callback = args2.pop();
          return eachfn(
            fns,
            function(fn, cb) {
              fn.apply(that, args2.concat([cb]));
            },
            callback
          );
        };
        if (arguments.length > 2) {
          var args = Array.prototype.slice.call(arguments, 2);
          return go.apply(this, args);
        } else {
          return go;
        }
      };
      async.applyEach = doParallel(_applyEach);
      async.applyEachSeries = doSeries(_applyEach);
      async.forever = function(fn, callback) {
        function next(err) {
          if (err) {
            if (callback) {
              return callback(err);
            }
            throw err;
          }
          fn(next);
        }
        next();
      };
      if (typeof define !== "undefined" && define.amd) {
        define([], function() {
          return async;
        });
      } else if (typeof module2 !== "undefined" && module2.exports) {
        module2.exports = async;
      } else {
        root.async = async;
      }
    })();
  }
});

// node_modules/fluent-ffmpeg/lib/processor.js
var require_processor = __commonJS({
  "node_modules/fluent-ffmpeg/lib/processor.js"(exports2, module2) {
    "use strict";
    var spawn = require("child_process").spawn;
    var path11 = require("path");
    var fs9 = require("fs");
    var async = require_async();
    var utils = require_utils();
    function runFfprobe(command) {
      const inputProbeIndex = 0;
      if (command._inputs[inputProbeIndex].isStream) {
        return;
      }
      command.ffprobe(inputProbeIndex, function(err, data) {
        command._ffprobeData = data;
      });
    }
    module2.exports = function(proto) {
      proto._spawnFfmpeg = function(args, options, processCB, endCB) {
        if (typeof options === "function") {
          endCB = processCB;
          processCB = options;
          options = {};
        }
        if (typeof endCB === "undefined") {
          endCB = processCB;
          processCB = function() {
          };
        }
        var maxLines = "stdoutLines" in options ? options.stdoutLines : this.options.stdoutLines;
        this._getFfmpegPath(function(err, command) {
          if (err) {
            return endCB(err);
          } else if (!command || command.length === 0) {
            return endCB(new Error("Cannot find ffmpeg"));
          }
          if (options.niceness && options.niceness !== 0 && !utils.isWindows) {
            args.unshift("-n", options.niceness, command);
            command = "nice";
          }
          var stdoutRing = utils.linesRing(maxLines);
          var stdoutClosed = false;
          var stderrRing = utils.linesRing(maxLines);
          var stderrClosed = false;
          var ffmpegProc = spawn(command, args, options);
          if (ffmpegProc.stderr) {
            ffmpegProc.stderr.setEncoding("utf8");
          }
          ffmpegProc.on("error", function(err2) {
            endCB(err2);
          });
          var exitError = null;
          function handleExit(err2) {
            if (err2) {
              exitError = err2;
            }
            if (processExited && (stdoutClosed || !options.captureStdout) && stderrClosed) {
              endCB(exitError, stdoutRing, stderrRing);
            }
          }
          var processExited = false;
          ffmpegProc.on("exit", function(code, signal) {
            processExited = true;
            if (signal) {
              handleExit(new Error("ffmpeg was killed with signal " + signal));
            } else if (code) {
              handleExit(new Error("ffmpeg exited with code " + code));
            } else {
              handleExit();
            }
          });
          if (options.captureStdout) {
            ffmpegProc.stdout.on("data", function(data) {
              stdoutRing.append(data);
            });
            ffmpegProc.stdout.on("close", function() {
              stdoutRing.close();
              stdoutClosed = true;
              handleExit();
            });
          }
          ffmpegProc.stderr.on("data", function(data) {
            stderrRing.append(data);
          });
          ffmpegProc.stderr.on("close", function() {
            stderrRing.close();
            stderrClosed = true;
            handleExit();
          });
          processCB(ffmpegProc, stdoutRing, stderrRing);
        });
      };
      proto._getArguments = function() {
        var complexFilters = this._complexFilters.get();
        var fileOutput = this._outputs.some(function(output) {
          return output.isFile;
        });
        return [].concat(
          // Inputs and input options
          this._inputs.reduce(function(args, input) {
            var source = typeof input.source === "string" ? input.source : "pipe:0";
            return args.concat(
              input.options.get(),
              ["-i", source]
            );
          }, []),
          // Global options
          this._global.get(),
          // Overwrite if we have file outputs
          fileOutput ? ["-y"] : [],
          // Complex filters
          complexFilters,
          // Outputs, filters and output options
          this._outputs.reduce(function(args, output) {
            var sizeFilters = utils.makeFilterStrings(output.sizeFilters.get());
            var audioFilters = output.audioFilters.get();
            var videoFilters = output.videoFilters.get().concat(sizeFilters);
            var outputArg;
            if (!output.target) {
              outputArg = [];
            } else if (typeof output.target === "string") {
              outputArg = [output.target];
            } else {
              outputArg = ["pipe:1"];
            }
            return args.concat(
              output.audio.get(),
              audioFilters.length ? ["-filter:a", audioFilters.join(",")] : [],
              output.video.get(),
              videoFilters.length ? ["-filter:v", videoFilters.join(",")] : [],
              output.options.get(),
              outputArg
            );
          }, [])
        );
      };
      proto._prepare = function(callback, readMetadata) {
        var self = this;
        async.waterfall([
          // Check codecs and formats
          function(cb) {
            self._checkCapabilities(cb);
          },
          // Read metadata if required
          function(cb) {
            if (!readMetadata) {
              return cb();
            }
            self.ffprobe(0, function(err, data) {
              if (!err) {
                self._ffprobeData = data;
              }
              cb();
            });
          },
          // Check for flvtool2/flvmeta if necessary
          function(cb) {
            var flvmeta = self._outputs.some(function(output) {
              if (output.flags.flvmeta && !output.isFile) {
                self.logger.warn("Updating flv metadata is only supported for files");
                output.flags.flvmeta = false;
              }
              return output.flags.flvmeta;
            });
            if (flvmeta) {
              self._getFlvtoolPath(function(err) {
                cb(err);
              });
            } else {
              cb();
            }
          },
          // Build argument list
          function(cb) {
            var args;
            try {
              args = self._getArguments();
            } catch (e) {
              return cb(e);
            }
            cb(null, args);
          },
          // Add "-strict experimental" option where needed
          function(args, cb) {
            self.availableEncoders(function(err, encoders) {
              for (var i = 0; i < args.length; i++) {
                if (args[i] === "-acodec" || args[i] === "-vcodec") {
                  i++;
                  if (args[i] in encoders && encoders[args[i]].experimental) {
                    args.splice(i + 1, 0, "-strict", "experimental");
                    i += 2;
                  }
                }
              }
              cb(null, args);
            });
          }
        ], callback);
        if (!readMetadata) {
          if (this.listeners("progress").length > 0) {
            runFfprobe(this);
          } else {
            this.once("newListener", function(event) {
              if (event === "progress") {
                runFfprobe(this);
              }
            });
          }
        }
      };
      proto.exec = proto.execute = proto.run = function() {
        var self = this;
        var outputPresent = this._outputs.some(function(output) {
          return "target" in output;
        });
        if (!outputPresent) {
          throw new Error("No output specified");
        }
        var outputStream = this._outputs.filter(function(output) {
          return typeof output.target !== "string";
        })[0];
        var inputStream = this._inputs.filter(function(input) {
          return typeof input.source !== "string";
        })[0];
        var ended = false;
        function emitEnd(err, stdout, stderr) {
          if (!ended) {
            ended = true;
            if (err) {
              self.emit("error", err, stdout, stderr);
            } else {
              self.emit("end", stdout, stderr);
            }
          }
        }
        self._prepare(function(err, args) {
          if (err) {
            return emitEnd(err);
          }
          self._spawnFfmpeg(
            args,
            {
              captureStdout: !outputStream,
              niceness: self.options.niceness,
              cwd: self.options.cwd,
              windowsHide: true
            },
            function processCB(ffmpegProc, stdoutRing, stderrRing) {
              self.ffmpegProc = ffmpegProc;
              self.emit("start", "ffmpeg " + args.join(" "));
              if (inputStream) {
                inputStream.source.on("error", function(err2) {
                  var reportingErr = new Error("Input stream error: " + err2.message);
                  reportingErr.inputStreamError = err2;
                  emitEnd(reportingErr);
                  ffmpegProc.kill();
                });
                inputStream.source.resume();
                inputStream.source.pipe(ffmpegProc.stdin);
                ffmpegProc.stdin.on("error", function() {
                });
              }
              if (self.options.timeout) {
                self.processTimer = setTimeout(function() {
                  var msg = "process ran into a timeout (" + self.options.timeout + "s)";
                  emitEnd(new Error(msg), stdoutRing.get(), stderrRing.get());
                  ffmpegProc.kill();
                }, self.options.timeout * 1e3);
              }
              if (outputStream) {
                ffmpegProc.stdout.pipe(outputStream.target, outputStream.pipeopts);
                outputStream.target.on("close", function() {
                  self.logger.debug("Output stream closed, scheduling kill for ffmpeg process");
                  setTimeout(function() {
                    emitEnd(new Error("Output stream closed"));
                    ffmpegProc.kill();
                  }, 20);
                });
                outputStream.target.on("error", function(err2) {
                  self.logger.debug("Output stream error, killing ffmpeg process");
                  var reportingErr = new Error("Output stream error: " + err2.message);
                  reportingErr.outputStreamError = err2;
                  emitEnd(reportingErr, stdoutRing.get(), stderrRing.get());
                  ffmpegProc.kill("SIGKILL");
                });
              }
              if (stderrRing) {
                if (self.listeners("stderr").length) {
                  stderrRing.callback(function(line) {
                    self.emit("stderr", line);
                  });
                }
                if (self.listeners("codecData").length) {
                  var codecDataSent = false;
                  var codecObject = {};
                  stderrRing.callback(function(line) {
                    if (!codecDataSent)
                      codecDataSent = utils.extractCodecData(self, line, codecObject);
                  });
                }
                if (self.listeners("progress").length) {
                  stderrRing.callback(function(line) {
                    utils.extractProgress(self, line);
                  });
                }
              }
            },
            function endCB(err2, stdoutRing, stderrRing) {
              clearTimeout(self.processTimer);
              delete self.ffmpegProc;
              if (err2) {
                if (err2.message.match(/ffmpeg exited with code/)) {
                  err2.message += ": " + utils.extractError(stderrRing.get());
                }
                emitEnd(err2, stdoutRing.get(), stderrRing.get());
              } else {
                var flvmeta = self._outputs.filter(function(output) {
                  return output.flags.flvmeta;
                });
                if (flvmeta.length) {
                  self._getFlvtoolPath(function(err3, flvtool) {
                    if (err3) {
                      return emitEnd(err3);
                    }
                    async.each(
                      flvmeta,
                      function(output, cb) {
                        spawn(flvtool, ["-U", output.target], { windowsHide: true }).on("error", function(err4) {
                          cb(new Error("Error running " + flvtool + " on " + output.target + ": " + err4.message));
                        }).on("exit", function(code, signal) {
                          if (code !== 0 || signal) {
                            cb(
                              new Error(flvtool + " " + (signal ? "received signal " + signal : "exited with code " + code)) + " when running on " + output.target
                            );
                          } else {
                            cb();
                          }
                        });
                      },
                      function(err4) {
                        if (err4) {
                          emitEnd(err4);
                        } else {
                          emitEnd(null, stdoutRing.get(), stderrRing.get());
                        }
                      }
                    );
                  });
                } else {
                  emitEnd(null, stdoutRing.get(), stderrRing.get());
                }
              }
            }
          );
        });
        return this;
      };
      proto.renice = function(niceness) {
        if (!utils.isWindows) {
          niceness = niceness || 0;
          if (niceness < -20 || niceness > 20) {
            this.logger.warn("Invalid niceness value: " + niceness + ", must be between -20 and 20");
          }
          niceness = Math.min(20, Math.max(-20, niceness));
          this.options.niceness = niceness;
          if (this.ffmpegProc) {
            var logger = this.logger;
            var pid = this.ffmpegProc.pid;
            var renice = spawn("renice", [niceness, "-p", pid], { windowsHide: true });
            renice.on("error", function(err) {
              logger.warn("could not renice process " + pid + ": " + err.message);
            });
            renice.on("exit", function(code, signal) {
              if (signal) {
                logger.warn("could not renice process " + pid + ": renice was killed by signal " + signal);
              } else if (code) {
                logger.warn("could not renice process " + pid + ": renice exited with " + code);
              } else {
                logger.info("successfully reniced process " + pid + " to " + niceness + " niceness");
              }
            });
          }
        }
        return this;
      };
      proto.kill = function(signal) {
        if (!this.ffmpegProc) {
          this.logger.warn("No running ffmpeg process, cannot send signal");
        } else {
          this.ffmpegProc.kill(signal || "SIGKILL");
        }
        return this;
      };
    };
  }
});

// node_modules/fluent-ffmpeg/lib/capabilities.js
var require_capabilities = __commonJS({
  "node_modules/fluent-ffmpeg/lib/capabilities.js"(exports2, module2) {
    "use strict";
    var fs9 = require("fs");
    var path11 = require("path");
    var async = require_async();
    var utils = require_utils();
    var avCodecRegexp = /^\s*([D ])([E ])([VAS])([S ])([D ])([T ]) ([^ ]+) +(.*)$/;
    var ffCodecRegexp = /^\s*([D\.])([E\.])([VAS])([I\.])([L\.])([S\.]) ([^ ]+) +(.*)$/;
    var ffEncodersRegexp = /\(encoders:([^\)]+)\)/;
    var ffDecodersRegexp = /\(decoders:([^\)]+)\)/;
    var encodersRegexp = /^\s*([VAS\.])([F\.])([S\.])([X\.])([B\.])([D\.]) ([^ ]+) +(.*)$/;
    var formatRegexp = /^\s*([D ])([E ])\s+([^ ]+)\s+(.*)$/;
    var lineBreakRegexp = /\r\n|\r|\n/;
    var filterRegexp = /^(?: [T\.][S\.][C\.] )?([^ ]+) +(AA?|VV?|\|)->(AA?|VV?|\|) +(.*)$/;
    var cache = {};
    module2.exports = function(proto) {
      proto.setFfmpegPath = function(ffmpegPath2) {
        cache.ffmpegPath = ffmpegPath2;
        return this;
      };
      proto.setFfprobePath = function(ffprobePath) {
        cache.ffprobePath = ffprobePath;
        return this;
      };
      proto.setFlvtoolPath = function(flvtool) {
        cache.flvtoolPath = flvtool;
        return this;
      };
      proto._forgetPaths = function() {
        delete cache.ffmpegPath;
        delete cache.ffprobePath;
        delete cache.flvtoolPath;
      };
      proto._getFfmpegPath = function(callback) {
        if ("ffmpegPath" in cache) {
          return callback(null, cache.ffmpegPath);
        }
        async.waterfall([
          // Try FFMPEG_PATH
          function(cb) {
            if (process.env.FFMPEG_PATH) {
              fs9.exists(process.env.FFMPEG_PATH, function(exists) {
                if (exists) {
                  cb(null, process.env.FFMPEG_PATH);
                } else {
                  cb(null, "");
                }
              });
            } else {
              cb(null, "");
            }
          },
          // Search in the PATH
          function(ffmpeg4, cb) {
            if (ffmpeg4.length) {
              return cb(null, ffmpeg4);
            }
            utils.which("ffmpeg", function(err, ffmpeg5) {
              cb(err, ffmpeg5);
            });
          }
        ], function(err, ffmpeg4) {
          if (err) {
            callback(err);
          } else {
            callback(null, cache.ffmpegPath = ffmpeg4 || "");
          }
        });
      };
      proto._getFfprobePath = function(callback) {
        var self = this;
        if ("ffprobePath" in cache) {
          return callback(null, cache.ffprobePath);
        }
        async.waterfall([
          // Try FFPROBE_PATH
          function(cb) {
            if (process.env.FFPROBE_PATH) {
              fs9.exists(process.env.FFPROBE_PATH, function(exists) {
                cb(null, exists ? process.env.FFPROBE_PATH : "");
              });
            } else {
              cb(null, "");
            }
          },
          // Search in the PATH
          function(ffprobe, cb) {
            if (ffprobe.length) {
              return cb(null, ffprobe);
            }
            utils.which("ffprobe", function(err, ffprobe2) {
              cb(err, ffprobe2);
            });
          },
          // Search in the same directory as ffmpeg
          function(ffprobe, cb) {
            if (ffprobe.length) {
              return cb(null, ffprobe);
            }
            self._getFfmpegPath(function(err, ffmpeg4) {
              if (err) {
                cb(err);
              } else if (ffmpeg4.length) {
                var name = utils.isWindows ? "ffprobe.exe" : "ffprobe";
                var ffprobe2 = path11.join(path11.dirname(ffmpeg4), name);
                fs9.exists(ffprobe2, function(exists) {
                  cb(null, exists ? ffprobe2 : "");
                });
              } else {
                cb(null, "");
              }
            });
          }
        ], function(err, ffprobe) {
          if (err) {
            callback(err);
          } else {
            callback(null, cache.ffprobePath = ffprobe || "");
          }
        });
      };
      proto._getFlvtoolPath = function(callback) {
        if ("flvtoolPath" in cache) {
          return callback(null, cache.flvtoolPath);
        }
        async.waterfall([
          // Try FLVMETA_PATH
          function(cb) {
            if (process.env.FLVMETA_PATH) {
              fs9.exists(process.env.FLVMETA_PATH, function(exists) {
                cb(null, exists ? process.env.FLVMETA_PATH : "");
              });
            } else {
              cb(null, "");
            }
          },
          // Try FLVTOOL2_PATH
          function(flvtool, cb) {
            if (flvtool.length) {
              return cb(null, flvtool);
            }
            if (process.env.FLVTOOL2_PATH) {
              fs9.exists(process.env.FLVTOOL2_PATH, function(exists) {
                cb(null, exists ? process.env.FLVTOOL2_PATH : "");
              });
            } else {
              cb(null, "");
            }
          },
          // Search for flvmeta in the PATH
          function(flvtool, cb) {
            if (flvtool.length) {
              return cb(null, flvtool);
            }
            utils.which("flvmeta", function(err, flvmeta) {
              cb(err, flvmeta);
            });
          },
          // Search for flvtool2 in the PATH
          function(flvtool, cb) {
            if (flvtool.length) {
              return cb(null, flvtool);
            }
            utils.which("flvtool2", function(err, flvtool2) {
              cb(err, flvtool2);
            });
          }
        ], function(err, flvtool) {
          if (err) {
            callback(err);
          } else {
            callback(null, cache.flvtoolPath = flvtool || "");
          }
        });
      };
      proto.availableFilters = proto.getAvailableFilters = function(callback) {
        if ("filters" in cache) {
          return callback(null, cache.filters);
        }
        this._spawnFfmpeg(["-filters"], { captureStdout: true, stdoutLines: 0 }, function(err, stdoutRing) {
          if (err) {
            return callback(err);
          }
          var stdout = stdoutRing.get();
          var lines = stdout.split("\n");
          var data = {};
          var types = { A: "audio", V: "video", "|": "none" };
          lines.forEach(function(line) {
            var match = line.match(filterRegexp);
            if (match) {
              data[match[1]] = {
                description: match[4],
                input: types[match[2].charAt(0)],
                multipleInputs: match[2].length > 1,
                output: types[match[3].charAt(0)],
                multipleOutputs: match[3].length > 1
              };
            }
          });
          callback(null, cache.filters = data);
        });
      };
      proto.availableCodecs = proto.getAvailableCodecs = function(callback) {
        if ("codecs" in cache) {
          return callback(null, cache.codecs);
        }
        this._spawnFfmpeg(["-codecs"], { captureStdout: true, stdoutLines: 0 }, function(err, stdoutRing) {
          if (err) {
            return callback(err);
          }
          var stdout = stdoutRing.get();
          var lines = stdout.split(lineBreakRegexp);
          var data = {};
          lines.forEach(function(line) {
            var match = line.match(avCodecRegexp);
            if (match && match[7] !== "=") {
              data[match[7]] = {
                type: { "V": "video", "A": "audio", "S": "subtitle" }[match[3]],
                description: match[8],
                canDecode: match[1] === "D",
                canEncode: match[2] === "E",
                drawHorizBand: match[4] === "S",
                directRendering: match[5] === "D",
                weirdFrameTruncation: match[6] === "T"
              };
            }
            match = line.match(ffCodecRegexp);
            if (match && match[7] !== "=") {
              var codecData = data[match[7]] = {
                type: { "V": "video", "A": "audio", "S": "subtitle" }[match[3]],
                description: match[8],
                canDecode: match[1] === "D",
                canEncode: match[2] === "E",
                intraFrameOnly: match[4] === "I",
                isLossy: match[5] === "L",
                isLossless: match[6] === "S"
              };
              var encoders = codecData.description.match(ffEncodersRegexp);
              encoders = encoders ? encoders[1].trim().split(" ") : [];
              var decoders = codecData.description.match(ffDecodersRegexp);
              decoders = decoders ? decoders[1].trim().split(" ") : [];
              if (encoders.length || decoders.length) {
                var coderData = {};
                utils.copy(codecData, coderData);
                delete coderData.canEncode;
                delete coderData.canDecode;
                encoders.forEach(function(name) {
                  data[name] = {};
                  utils.copy(coderData, data[name]);
                  data[name].canEncode = true;
                });
                decoders.forEach(function(name) {
                  if (name in data) {
                    data[name].canDecode = true;
                  } else {
                    data[name] = {};
                    utils.copy(coderData, data[name]);
                    data[name].canDecode = true;
                  }
                });
              }
            }
          });
          callback(null, cache.codecs = data);
        });
      };
      proto.availableEncoders = proto.getAvailableEncoders = function(callback) {
        if ("encoders" in cache) {
          return callback(null, cache.encoders);
        }
        this._spawnFfmpeg(["-encoders"], { captureStdout: true, stdoutLines: 0 }, function(err, stdoutRing) {
          if (err) {
            return callback(err);
          }
          var stdout = stdoutRing.get();
          var lines = stdout.split(lineBreakRegexp);
          var data = {};
          lines.forEach(function(line) {
            var match = line.match(encodersRegexp);
            if (match && match[7] !== "=") {
              data[match[7]] = {
                type: { "V": "video", "A": "audio", "S": "subtitle" }[match[1]],
                description: match[8],
                frameMT: match[2] === "F",
                sliceMT: match[3] === "S",
                experimental: match[4] === "X",
                drawHorizBand: match[5] === "B",
                directRendering: match[6] === "D"
              };
            }
          });
          callback(null, cache.encoders = data);
        });
      };
      proto.availableFormats = proto.getAvailableFormats = function(callback) {
        if ("formats" in cache) {
          return callback(null, cache.formats);
        }
        this._spawnFfmpeg(["-formats"], { captureStdout: true, stdoutLines: 0 }, function(err, stdoutRing) {
          if (err) {
            return callback(err);
          }
          var stdout = stdoutRing.get();
          var lines = stdout.split(lineBreakRegexp);
          var data = {};
          lines.forEach(function(line) {
            var match = line.match(formatRegexp);
            if (match) {
              match[3].split(",").forEach(function(format) {
                if (!(format in data)) {
                  data[format] = {
                    description: match[4],
                    canDemux: false,
                    canMux: false
                  };
                }
                if (match[1] === "D") {
                  data[format].canDemux = true;
                }
                if (match[2] === "E") {
                  data[format].canMux = true;
                }
              });
            }
          });
          callback(null, cache.formats = data);
        });
      };
      proto._checkCapabilities = function(callback) {
        var self = this;
        async.waterfall([
          // Get available formats
          function(cb) {
            self.availableFormats(cb);
          },
          // Check whether specified formats are available
          function(formats, cb) {
            var unavailable;
            unavailable = self._outputs.reduce(function(fmts, output) {
              var format = output.options.find("-f", 1);
              if (format) {
                if (!(format[0] in formats) || !formats[format[0]].canMux) {
                  fmts.push(format);
                }
              }
              return fmts;
            }, []);
            if (unavailable.length === 1) {
              return cb(new Error("Output format " + unavailable[0] + " is not available"));
            } else if (unavailable.length > 1) {
              return cb(new Error("Output formats " + unavailable.join(", ") + " are not available"));
            }
            unavailable = self._inputs.reduce(function(fmts, input) {
              var format = input.options.find("-f", 1);
              if (format) {
                if (!(format[0] in formats) || !formats[format[0]].canDemux) {
                  fmts.push(format[0]);
                }
              }
              return fmts;
            }, []);
            if (unavailable.length === 1) {
              return cb(new Error("Input format " + unavailable[0] + " is not available"));
            } else if (unavailable.length > 1) {
              return cb(new Error("Input formats " + unavailable.join(", ") + " are not available"));
            }
            cb();
          },
          // Get available codecs
          function(cb) {
            self.availableEncoders(cb);
          },
          // Check whether specified codecs are available and add strict experimental options if needed
          function(encoders, cb) {
            var unavailable;
            unavailable = self._outputs.reduce(function(cdcs, output) {
              var acodec = output.audio.find("-acodec", 1);
              if (acodec && acodec[0] !== "copy") {
                if (!(acodec[0] in encoders) || encoders[acodec[0]].type !== "audio") {
                  cdcs.push(acodec[0]);
                }
              }
              return cdcs;
            }, []);
            if (unavailable.length === 1) {
              return cb(new Error("Audio codec " + unavailable[0] + " is not available"));
            } else if (unavailable.length > 1) {
              return cb(new Error("Audio codecs " + unavailable.join(", ") + " are not available"));
            }
            unavailable = self._outputs.reduce(function(cdcs, output) {
              var vcodec = output.video.find("-vcodec", 1);
              if (vcodec && vcodec[0] !== "copy") {
                if (!(vcodec[0] in encoders) || encoders[vcodec[0]].type !== "video") {
                  cdcs.push(vcodec[0]);
                }
              }
              return cdcs;
            }, []);
            if (unavailable.length === 1) {
              return cb(new Error("Video codec " + unavailable[0] + " is not available"));
            } else if (unavailable.length > 1) {
              return cb(new Error("Video codecs " + unavailable.join(", ") + " are not available"));
            }
            cb();
          }
        ], callback);
      };
    };
  }
});

// node_modules/fluent-ffmpeg/lib/ffprobe.js
var require_ffprobe = __commonJS({
  "node_modules/fluent-ffmpeg/lib/ffprobe.js"(exports2, module2) {
    "use strict";
    var spawn = require("child_process").spawn;
    function legacyTag(key) {
      return key.match(/^TAG:/);
    }
    function legacyDisposition(key) {
      return key.match(/^DISPOSITION:/);
    }
    function parseFfprobeOutput(out) {
      var lines = out.split(/\r\n|\r|\n/);
      lines = lines.filter(function(line2) {
        return line2.length > 0;
      });
      var data = {
        streams: [],
        format: {},
        chapters: []
      };
      function parseBlock(name) {
        var data2 = {};
        var line2 = lines.shift();
        while (typeof line2 !== "undefined") {
          if (line2.toLowerCase() == "[/" + name + "]") {
            return data2;
          } else if (line2.match(/^\[/)) {
            line2 = lines.shift();
            continue;
          }
          var kv = line2.match(/^([^=]+)=(.*)$/);
          if (kv) {
            if (!kv[1].match(/^TAG:/) && kv[2].match(/^[0-9]+(\.[0-9]+)?$/)) {
              data2[kv[1]] = Number(kv[2]);
            } else {
              data2[kv[1]] = kv[2];
            }
          }
          line2 = lines.shift();
        }
        return data2;
      }
      var line = lines.shift();
      while (typeof line !== "undefined") {
        if (line.match(/^\[stream/i)) {
          var stream = parseBlock("stream");
          data.streams.push(stream);
        } else if (line.match(/^\[chapter/i)) {
          var chapter = parseBlock("chapter");
          data.chapters.push(chapter);
        } else if (line.toLowerCase() === "[format]") {
          data.format = parseBlock("format");
        }
        line = lines.shift();
      }
      return data;
    }
    module2.exports = function(proto) {
      proto.ffprobe = function() {
        var input, index = null, options = [], callback;
        var callback = arguments[arguments.length - 1];
        var ended = false;
        function handleCallback(err, data) {
          if (!ended) {
            ended = true;
            callback(err, data);
          }
        }
        ;
        switch (arguments.length) {
          case 3:
            index = arguments[0];
            options = arguments[1];
            break;
          case 2:
            if (typeof arguments[0] === "number") {
              index = arguments[0];
            } else if (Array.isArray(arguments[0])) {
              options = arguments[0];
            }
            break;
        }
        if (index === null) {
          if (!this._currentInput) {
            return handleCallback(new Error("No input specified"));
          }
          input = this._currentInput;
        } else {
          input = this._inputs[index];
          if (!input) {
            return handleCallback(new Error("Invalid input index"));
          }
        }
        this._getFfprobePath(function(err, path11) {
          if (err) {
            return handleCallback(err);
          } else if (!path11) {
            return handleCallback(new Error("Cannot find ffprobe"));
          }
          var stdout = "";
          var stdoutClosed = false;
          var stderr = "";
          var stderrClosed = false;
          var src = input.isStream ? "pipe:0" : input.source;
          var ffprobe = spawn(path11, ["-show_streams", "-show_format"].concat(options, src), { windowsHide: true });
          if (input.isStream) {
            ffprobe.stdin.on("error", function(err2) {
              if (["ECONNRESET", "EPIPE", "EOF"].indexOf(err2.code) >= 0) {
                return;
              }
              handleCallback(err2);
            });
            ffprobe.stdin.on("close", function() {
              input.source.pause();
              input.source.unpipe(ffprobe.stdin);
            });
            input.source.pipe(ffprobe.stdin);
          }
          ffprobe.on("error", callback);
          var exitError = null;
          function handleExit(err2) {
            if (err2) {
              exitError = err2;
            }
            if (processExited && stdoutClosed && stderrClosed) {
              if (exitError) {
                if (stderr) {
                  exitError.message += "\n" + stderr;
                }
                return handleCallback(exitError);
              }
              var data = parseFfprobeOutput(stdout);
              [data.format].concat(data.streams).forEach(function(target) {
                if (target) {
                  var legacyTagKeys = Object.keys(target).filter(legacyTag);
                  if (legacyTagKeys.length) {
                    target.tags = target.tags || {};
                    legacyTagKeys.forEach(function(tagKey) {
                      target.tags[tagKey.substr(4)] = target[tagKey];
                      delete target[tagKey];
                    });
                  }
                  var legacyDispositionKeys = Object.keys(target).filter(legacyDisposition);
                  if (legacyDispositionKeys.length) {
                    target.disposition = target.disposition || {};
                    legacyDispositionKeys.forEach(function(dispositionKey) {
                      target.disposition[dispositionKey.substr(12)] = target[dispositionKey];
                      delete target[dispositionKey];
                    });
                  }
                }
              });
              handleCallback(null, data);
            }
          }
          var processExited = false;
          ffprobe.on("exit", function(code, signal) {
            processExited = true;
            if (code) {
              handleExit(new Error("ffprobe exited with code " + code));
            } else if (signal) {
              handleExit(new Error("ffprobe was killed with signal " + signal));
            } else {
              handleExit();
            }
          });
          ffprobe.stdout.on("data", function(data) {
            stdout += data;
          });
          ffprobe.stdout.on("close", function() {
            stdoutClosed = true;
            handleExit();
          });
          ffprobe.stderr.on("data", function(data) {
            stderr += data;
          });
          ffprobe.stderr.on("close", function() {
            stderrClosed = true;
            handleExit();
          });
        });
      };
    };
  }
});

// node_modules/fluent-ffmpeg/lib/recipes.js
var require_recipes = __commonJS({
  "node_modules/fluent-ffmpeg/lib/recipes.js"(exports2, module2) {
    "use strict";
    var fs9 = require("fs");
    var path11 = require("path");
    var PassThrough = require("stream").PassThrough;
    var async = require_async();
    var utils = require_utils();
    module2.exports = function recipes(proto) {
      proto.saveToFile = proto.save = function(output) {
        this.output(output).run();
        return this;
      };
      proto.writeToStream = proto.pipe = proto.stream = function(stream, options) {
        if (stream && !("writable" in stream)) {
          options = stream;
          stream = void 0;
        }
        if (!stream) {
          if (process.version.match(/v0\.8\./)) {
            throw new Error("PassThrough stream is not supported on node v0.8");
          }
          stream = new PassThrough();
        }
        this.output(stream, options).run();
        return stream;
      };
      proto.takeScreenshots = proto.thumbnail = proto.thumbnails = proto.screenshot = proto.screenshots = function(config, folder) {
        var self = this;
        var source = this._currentInput.source;
        config = config || { count: 1 };
        if (typeof config === "number") {
          config = {
            count: config
          };
        }
        if (!("folder" in config)) {
          config.folder = folder || ".";
        }
        if ("timestamps" in config) {
          config.timemarks = config.timestamps;
        }
        if (!("timemarks" in config)) {
          if (!config.count) {
            throw new Error("Cannot take screenshots: neither a count nor a timemark list are specified");
          }
          var interval = 100 / (1 + config.count);
          config.timemarks = [];
          for (var i = 0; i < config.count; i++) {
            config.timemarks.push(interval * (i + 1) + "%");
          }
        }
        if ("size" in config) {
          var fixedSize = config.size.match(/^(\d+)x(\d+)$/);
          var fixedWidth = config.size.match(/^(\d+)x\?$/);
          var fixedHeight = config.size.match(/^\?x(\d+)$/);
          var percentSize = config.size.match(/^(\d+)%$/);
          if (!fixedSize && !fixedWidth && !fixedHeight && !percentSize) {
            throw new Error("Invalid size parameter: " + config.size);
          }
        }
        var metadata;
        function getMetadata(cb) {
          if (metadata) {
            cb(null, metadata);
          } else {
            self.ffprobe(function(err, meta) {
              metadata = meta;
              cb(err, meta);
            });
          }
        }
        async.waterfall([
          // Compute percent timemarks if any
          function computeTimemarks(next) {
            if (config.timemarks.some(function(t) {
              return ("" + t).match(/^[\d.]+%$/);
            })) {
              if (typeof source !== "string") {
                return next(new Error("Cannot compute screenshot timemarks with an input stream, please specify fixed timemarks"));
              }
              getMetadata(function(err, meta) {
                if (err) {
                  next(err);
                } else {
                  var vstream = meta.streams.reduce(function(biggest, stream) {
                    if (stream.codec_type === "video" && stream.width * stream.height > biggest.width * biggest.height) {
                      return stream;
                    } else {
                      return biggest;
                    }
                  }, { width: 0, height: 0 });
                  if (vstream.width === 0) {
                    return next(new Error("No video stream in input, cannot take screenshots"));
                  }
                  var duration = Number(vstream.duration);
                  if (isNaN(duration)) {
                    duration = Number(meta.format.duration);
                  }
                  if (isNaN(duration)) {
                    return next(new Error("Could not get input duration, please specify fixed timemarks"));
                  }
                  config.timemarks = config.timemarks.map(function(mark) {
                    if (("" + mark).match(/^([\d.]+)%$/)) {
                      return duration * parseFloat(mark) / 100;
                    } else {
                      return mark;
                    }
                  });
                  next();
                }
              });
            } else {
              next();
            }
          },
          // Turn all timemarks into numbers and sort them
          function normalizeTimemarks(next) {
            config.timemarks = config.timemarks.map(function(mark) {
              return utils.timemarkToSeconds(mark);
            }).sort(function(a, b) {
              return a - b;
            });
            next();
          },
          // Add '_%i' to pattern when requesting multiple screenshots and no variable token is present
          function fixPattern(next) {
            var pattern = config.filename || "tn.png";
            if (pattern.indexOf(".") === -1) {
              pattern += ".png";
            }
            if (config.timemarks.length > 1 && !pattern.match(/%(s|0*i)/)) {
              var ext = path11.extname(pattern);
              pattern = path11.join(path11.dirname(pattern), path11.basename(pattern, ext) + "_%i" + ext);
            }
            next(null, pattern);
          },
          // Replace filename tokens (%f, %b) in pattern
          function replaceFilenameTokens(pattern, next) {
            if (pattern.match(/%[bf]/)) {
              if (typeof source !== "string") {
                return next(new Error("Cannot replace %f or %b when using an input stream"));
              }
              pattern = pattern.replace(/%f/g, path11.basename(source)).replace(/%b/g, path11.basename(source, path11.extname(source)));
            }
            next(null, pattern);
          },
          // Compute size if needed
          function getSize(pattern, next) {
            if (pattern.match(/%[whr]/)) {
              if (fixedSize) {
                return next(null, pattern, fixedSize[1], fixedSize[2]);
              }
              getMetadata(function(err, meta) {
                if (err) {
                  return next(new Error("Could not determine video resolution to replace %w, %h or %r"));
                }
                var vstream = meta.streams.reduce(function(biggest, stream) {
                  if (stream.codec_type === "video" && stream.width * stream.height > biggest.width * biggest.height) {
                    return stream;
                  } else {
                    return biggest;
                  }
                }, { width: 0, height: 0 });
                if (vstream.width === 0) {
                  return next(new Error("No video stream in input, cannot replace %w, %h or %r"));
                }
                var width = vstream.width;
                var height = vstream.height;
                if (fixedWidth) {
                  height = height * Number(fixedWidth[1]) / width;
                  width = Number(fixedWidth[1]);
                } else if (fixedHeight) {
                  width = width * Number(fixedHeight[1]) / height;
                  height = Number(fixedHeight[1]);
                } else if (percentSize) {
                  width = width * Number(percentSize[1]) / 100;
                  height = height * Number(percentSize[1]) / 100;
                }
                next(null, pattern, Math.round(width / 2) * 2, Math.round(height / 2) * 2);
              });
            } else {
              next(null, pattern, -1, -1);
            }
          },
          // Replace size tokens (%w, %h, %r) in pattern
          function replaceSizeTokens(pattern, width, height, next) {
            pattern = pattern.replace(/%r/g, "%wx%h").replace(/%w/g, width).replace(/%h/g, height);
            next(null, pattern);
          },
          // Replace variable tokens in pattern (%s, %i) and generate filename list
          function replaceVariableTokens(pattern, next) {
            var filenames = config.timemarks.map(function(t, i2) {
              return pattern.replace(/%s/g, utils.timemarkToSeconds(t)).replace(/%(0*)i/g, function(match, padding) {
                var idx = "" + (i2 + 1);
                return padding.substr(0, Math.max(0, padding.length + 1 - idx.length)) + idx;
              });
            });
            self.emit("filenames", filenames);
            next(null, filenames);
          },
          // Create output directory
          function createDirectory(filenames, next) {
            fs9.exists(config.folder, function(exists) {
              if (!exists) {
                fs9.mkdir(config.folder, function(err) {
                  if (err) {
                    next(err);
                  } else {
                    next(null, filenames);
                  }
                });
              } else {
                next(null, filenames);
              }
            });
          }
        ], function runCommand(err, filenames) {
          if (err) {
            return self.emit("error", err);
          }
          var count = config.timemarks.length;
          var split;
          var filters = [split = {
            filter: "split",
            options: count,
            outputs: []
          }];
          if ("size" in config) {
            self.size(config.size);
            var sizeFilters = self._currentOutput.sizeFilters.get().map(function(f, i3) {
              if (i3 > 0) {
                f.inputs = "size" + (i3 - 1);
              }
              f.outputs = "size" + i3;
              return f;
            });
            split.inputs = "size" + (sizeFilters.length - 1);
            filters = sizeFilters.concat(filters);
            self._currentOutput.sizeFilters.clear();
          }
          var first = 0;
          for (var i2 = 0; i2 < count; i2++) {
            var stream = "screen" + i2;
            split.outputs.push(stream);
            if (i2 === 0) {
              first = config.timemarks[i2];
              self.seekInput(first);
            }
            self.output(path11.join(config.folder, filenames[i2])).frames(1).map(stream);
            if (i2 > 0) {
              self.seek(config.timemarks[i2] - first);
            }
          }
          self.complexFilter(filters);
          self.run();
        });
        return this;
      };
      proto.mergeToFile = proto.concatenate = proto.concat = function(target, options) {
        var fileInput = this._inputs.filter(function(input) {
          return !input.isStream;
        })[0];
        var self = this;
        this.ffprobe(this._inputs.indexOf(fileInput), function(err, data) {
          if (err) {
            return self.emit("error", err);
          }
          var hasAudioStreams = data.streams.some(function(stream) {
            return stream.codec_type === "audio";
          });
          var hasVideoStreams = data.streams.some(function(stream) {
            return stream.codec_type === "video";
          });
          self.output(target, options).complexFilter({
            filter: "concat",
            options: {
              n: self._inputs.length,
              v: hasVideoStreams ? 1 : 0,
              a: hasAudioStreams ? 1 : 0
            }
          }).run();
        });
        return this;
      };
    };
  }
});

// node_modules/fluent-ffmpeg/lib/fluent-ffmpeg.js
var require_fluent_ffmpeg = __commonJS({
  "node_modules/fluent-ffmpeg/lib/fluent-ffmpeg.js"(exports2, module2) {
    "use strict";
    var path11 = require("path");
    var util = require("util");
    var EventEmitter = require("events").EventEmitter;
    var utils = require_utils();
    function FfmpegCommand(input, options) {
      if (!(this instanceof FfmpegCommand)) {
        return new FfmpegCommand(input, options);
      }
      EventEmitter.call(this);
      if (typeof input === "object" && !("readable" in input)) {
        options = input;
      } else {
        options = options || {};
        options.source = input;
      }
      this._inputs = [];
      if (options.source) {
        this.input(options.source);
      }
      this._outputs = [];
      this.output();
      var self = this;
      ["_global", "_complexFilters"].forEach(function(prop) {
        self[prop] = utils.args();
      });
      options.stdoutLines = "stdoutLines" in options ? options.stdoutLines : 100;
      options.presets = options.presets || options.preset || path11.join(__dirname, "presets");
      options.niceness = options.niceness || options.priority || 0;
      this.options = options;
      this.logger = options.logger || {
        debug: function() {
        },
        info: function() {
        },
        warn: function() {
        },
        error: function() {
        }
      };
    }
    util.inherits(FfmpegCommand, EventEmitter);
    module2.exports = FfmpegCommand;
    FfmpegCommand.prototype.clone = function() {
      var clone = new FfmpegCommand();
      var self = this;
      clone.options = this.options;
      clone.logger = this.logger;
      clone._inputs = this._inputs.map(function(input) {
        return {
          source: input.source,
          options: input.options.clone()
        };
      });
      if ("target" in this._outputs[0]) {
        clone._outputs = [];
        clone.output();
      } else {
        clone._outputs = [
          clone._currentOutput = {
            flags: {}
          }
        ];
        ["audio", "audioFilters", "video", "videoFilters", "sizeFilters", "options"].forEach(function(key) {
          clone._currentOutput[key] = self._currentOutput[key].clone();
        });
        if (this._currentOutput.sizeData) {
          clone._currentOutput.sizeData = {};
          utils.copy(this._currentOutput.sizeData, clone._currentOutput.sizeData);
        }
        utils.copy(this._currentOutput.flags, clone._currentOutput.flags);
      }
      ["_global", "_complexFilters"].forEach(function(prop) {
        clone[prop] = self[prop].clone();
      });
      return clone;
    };
    require_inputs()(FfmpegCommand.prototype);
    require_audio()(FfmpegCommand.prototype);
    require_video()(FfmpegCommand.prototype);
    require_videosize()(FfmpegCommand.prototype);
    require_output()(FfmpegCommand.prototype);
    require_custom()(FfmpegCommand.prototype);
    require_misc()(FfmpegCommand.prototype);
    require_processor()(FfmpegCommand.prototype);
    require_capabilities()(FfmpegCommand.prototype);
    FfmpegCommand.setFfmpegPath = function(path12) {
      new FfmpegCommand().setFfmpegPath(path12);
    };
    FfmpegCommand.setFfprobePath = function(path12) {
      new FfmpegCommand().setFfprobePath(path12);
    };
    FfmpegCommand.setFlvtoolPath = function(path12) {
      new FfmpegCommand().setFlvtoolPath(path12);
    };
    FfmpegCommand.availableFilters = FfmpegCommand.getAvailableFilters = function(callback) {
      new FfmpegCommand().availableFilters(callback);
    };
    FfmpegCommand.availableCodecs = FfmpegCommand.getAvailableCodecs = function(callback) {
      new FfmpegCommand().availableCodecs(callback);
    };
    FfmpegCommand.availableFormats = FfmpegCommand.getAvailableFormats = function(callback) {
      new FfmpegCommand().availableFormats(callback);
    };
    FfmpegCommand.availableEncoders = FfmpegCommand.getAvailableEncoders = function(callback) {
      new FfmpegCommand().availableEncoders(callback);
    };
    require_ffprobe()(FfmpegCommand.prototype);
    FfmpegCommand.ffprobe = function(file) {
      var instance = new FfmpegCommand(file);
      instance.ffprobe.apply(instance, Array.prototype.slice.call(arguments, 1));
    };
    require_recipes()(FfmpegCommand.prototype);
  }
});

// node_modules/fluent-ffmpeg/index.js
var require_fluent_ffmpeg2 = __commonJS({
  "node_modules/fluent-ffmpeg/index.js"(exports2, module2) {
    module2.exports = require_fluent_ffmpeg();
  }
});

// node_modules/@ffmpeg-installer/ffmpeg/lib/verify-file.js
var require_verify_file = __commonJS({
  "node_modules/@ffmpeg-installer/ffmpeg/lib/verify-file.js"(exports2, module2) {
    var fs9 = require("fs");
    function verifyFile(file) {
      try {
        var stats = fs9.statSync(file);
        return stats.isFile();
      } catch (ignored) {
        return false;
      }
    }
    module2.exports = verifyFile;
  }
});

// node_modules/@ffmpeg-installer/ffmpeg/package.json
var require_package = __commonJS({
  "node_modules/@ffmpeg-installer/ffmpeg/package.json"(exports2, module2) {
    module2.exports = {
      name: "@ffmpeg-installer/ffmpeg",
      version: "1.1.0",
      main: "index.js",
      scripts: {
        lint: "jshint *.js",
        preversion: "npm run lint",
        types: "tsc",
        preupload: "npm run types",
        upload: "npm --userconfig=.npmrc publish --access public",
        test: "tsd"
      },
      types: "types/index.d.ts",
      keywords: [
        "ffmpeg",
        "binary",
        "installer",
        "audio",
        "sound"
      ],
      author: "Kristoffer Lund\xE9n <kristoffer.lunden@gmail.com>",
      license: "LGPL-2.1",
      description: "Platform independent binary installer of FFmpeg for node projects",
      optionalDependencies: {
        "@ffmpeg-installer/darwin-arm64": "4.1.5",
        "@ffmpeg-installer/darwin-x64": "4.1.0",
        "@ffmpeg-installer/linux-arm": "4.1.3",
        "@ffmpeg-installer/linux-arm64": "4.1.4",
        "@ffmpeg-installer/linux-ia32": "4.1.0",
        "@ffmpeg-installer/linux-x64": "4.1.0",
        "@ffmpeg-installer/win32-ia32": "4.1.0",
        "@ffmpeg-installer/win32-x64": "4.1.0"
      },
      devDependencies: {
        jshint: "^2.9.3",
        tsd: "^0.14.0",
        typescript: "^4.2.3"
      },
      repository: {
        type: "git",
        url: "git+https://github.com/kribblo/node-ffmpeg-installer.git"
      },
      bugs: {
        url: "https://github.com/kribblo/node-ffmpeg-installer/issues"
      },
      homepage: "https://github.com/kribblo/node-ffmpeg-installer#readme"
    };
  }
});

// node_modules/@ffmpeg-installer/ffmpeg/index.js
var require_ffmpeg = __commonJS({
  "node_modules/@ffmpeg-installer/ffmpeg/index.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var path11 = require("path");
    var verifyFile = require_verify_file();
    var platform = os.platform() + "-" + os.arch();
    var packageName = "@ffmpeg-installer/" + platform;
    if (!require_package().optionalDependencies[packageName]) {
      throw "Unsupported platform/architecture: " + platform;
    }
    var binary = os.platform() === "win32" ? "ffmpeg.exe" : "ffmpeg";
    var topLevelPath = path11.resolve(__dirname.substr(0, __dirname.indexOf("node_modules")), "node_modules", "@ffmpeg-installer", platform);
    var npm3Path = path11.resolve(__dirname, "..", platform);
    var npm2Path = path11.resolve(__dirname, "node_modules", "@ffmpeg-installer", platform);
    var topLevelBinary = path11.join(topLevelPath, binary);
    var npm3Binary = path11.join(npm3Path, binary);
    var npm2Binary = path11.join(npm2Path, binary);
    var topLevelPackage = path11.join(topLevelPath, "package.json");
    var npm3Package = path11.join(npm3Path, "package.json");
    var npm2Package = path11.join(npm2Path, "package.json");
    var ffmpegPath2;
    var packageJson;
    if (verifyFile(npm3Binary)) {
      ffmpegPath2 = npm3Binary;
      packageJson = require(npm3Package);
    } else if (verifyFile(npm2Binary)) {
      ffmpegPath2 = npm2Binary;
      packageJson = require(npm2Package);
    } else if (verifyFile(topLevelBinary)) {
      ffmpegPath2 = topLevelBinary;
      packageJson = require(topLevelPackage);
    } else {
      throw 'Could not find ffmpeg executable, tried "' + npm3Binary + '", "' + npm2Binary + '" and "' + topLevelBinary + '"';
    }
    var version = packageJson.ffmpeg || packageJson.version;
    var url = packageJson.homepage;
    module2.exports = {
      path: ffmpegPath2,
      version,
      url
    };
  }
});

// node_modules/@ffprobe-installer/ffprobe/lib/verify-file.js
var require_verify_file2 = __commonJS({
  "node_modules/@ffprobe-installer/ffprobe/lib/verify-file.js"(exports2, module2) {
    var fs9 = require("node:fs");
    function verifyFile(file) {
      try {
        const stats = fs9.statSync(file);
        return stats.isFile();
      } catch {
        return false;
      }
    }
    module2.exports = verifyFile;
  }
});

// node_modules/@ffprobe-installer/ffprobe/package.json
var require_package2 = __commonJS({
  "node_modules/@ffprobe-installer/ffprobe/package.json"(exports2, module2) {
    module2.exports = {
      name: "@ffprobe-installer/ffprobe",
      version: "2.1.2",
      main: "index.js",
      scripts: {
        lint: "xo",
        preversion: "npm run test",
        types: "tsc",
        test: "xo && nyc ava && nyc report --reporter=text-lcov > coverage.lcov && codecov -t 54b3d620-a296-4d71-a717-c3e6e24ae9d9",
        prepare: "npm run types && husky install && shx rm -rf .git/hooks && shx ln -s ../.husky .git/hooks"
      },
      types: "types/index.d.ts",
      keywords: [
        "ffprobe",
        "binary"
      ],
      author: "Oliver Sayers <talk@savagecore.uk>",
      license: "LGPL-2.1",
      description: "Platform independent binary installer of FFprobe for node projects",
      files: [
        "index.js",
        "lib",
        "platform",
        "types",
        "tsconfig.json"
      ],
      optionalDependencies: {
        "@ffprobe-installer/darwin-arm64": "5.0.1",
        "@ffprobe-installer/darwin-x64": "5.1.0",
        "@ffprobe-installer/linux-arm": "5.2.0",
        "@ffprobe-installer/linux-arm64": "5.2.0",
        "@ffprobe-installer/linux-ia32": "5.2.0",
        "@ffprobe-installer/linux-x64": "5.2.0",
        "@ffprobe-installer/win32-ia32": "5.1.0",
        "@ffprobe-installer/win32-x64": "5.1.0"
      },
      devDependencies: {
        ava: "^5.2.0",
        codecov: "^3.7.2",
        execa: "^8.0.1",
        executable: "^4.1.1",
        husky: "^8.0.3",
        nyc: "^15.1.0",
        shx: "^0.3.3",
        typescript: "^5.1.6",
        xo: "^0.56.0"
      },
      repository: {
        type: "git",
        url: "git+https://github.com/SavageCore/node-ffprobe-installer.git"
      },
      bugs: {
        url: "https://github.com/SavageCore/node-ffprobe-installer/issues"
      },
      homepage: "https://github.com/SavageCore/node-ffprobe-installer#readme",
      xo: {
        rules: {
          "unicorn/prefer-module": 0,
          "unicorn/prefer-top-level-await": 0
        }
      },
      engines: {
        node: ">=14.21.2"
      }
    };
  }
});

// node_modules/@ffprobe-installer/ffprobe/index.js
var require_ffprobe2 = __commonJS({
  "node_modules/@ffprobe-installer/ffprobe/index.js"(exports2, module2) {
    var os = require("node:os");
    var process2 = require("node:process");
    var verifyFile = require_verify_file2();
    var platform = process2.env.npm_config_platform || os.platform();
    var arch = process2.env.npm_config_arch || os.arch();
    var target = platform + "-" + arch;
    var packageName = "@ffprobe-installer/" + target;
    if (!require_package2().optionalDependencies[packageName]) {
      throw new Error("Unsupported platform/architecture: " + target);
    }
    var binary = platform === "win32" ? "ffprobe.exe" : "ffprobe";
    var ffprobePath = require.resolve(`${packageName}/${binary}`);
    if (!verifyFile(ffprobePath)) {
      throw new Error(`Could not find ffprobe executable, tried "${ffprobePath}"`);
    }
    var packageJson = require(`${packageName}/package.json`);
    var version = packageJson.ffprobe || packageJson.version;
    var url = packageJson.homepage;
    module2.exports = {
      path: ffprobePath,
      version,
      url
    };
  }
});

// node_modules/sharp/lib/is.js
var require_is = __commonJS({
  "node_modules/sharp/lib/is.js"(exports2, module2) {
    var defined = (val) => typeof val !== "undefined" && val !== null;
    var object = (val) => typeof val === "object";
    var plainObject = (val) => Object.prototype.toString.call(val) === "[object Object]";
    var fn = (val) => typeof val === "function";
    var bool = (val) => typeof val === "boolean";
    var buffer = (val) => val instanceof Buffer;
    var typedArray = (val) => {
      if (defined(val)) {
        switch (val.constructor) {
          case Uint8Array:
          case Uint8ClampedArray:
          case Int8Array:
          case Uint16Array:
          case Int16Array:
          case Uint32Array:
          case Int32Array:
          case Float32Array:
          case Float64Array:
            return true;
        }
      }
      return false;
    };
    var arrayBuffer = (val) => val instanceof ArrayBuffer;
    var string = (val) => typeof val === "string" && val.length > 0;
    var number = (val) => typeof val === "number" && !Number.isNaN(val);
    var integer = (val) => Number.isInteger(val);
    var inRange = (val, min, max) => val >= min && val <= max;
    var inArray = (val, list) => list.includes(val);
    var invalidParameterError = (name, expected, actual) => new Error(
      `Expected ${expected} for ${name} but received ${actual} of type ${typeof actual}`
    );
    var nativeError = (native, context) => {
      context.message = native.message;
      return context;
    };
    module2.exports = {
      defined,
      object,
      plainObject,
      fn,
      bool,
      buffer,
      typedArray,
      arrayBuffer,
      string,
      number,
      integer,
      inRange,
      inArray,
      invalidParameterError,
      nativeError
    };
  }
});

// node_modules/detect-libc/lib/process.js
var require_process = __commonJS({
  "node_modules/detect-libc/lib/process.js"(exports2, module2) {
    "use strict";
    var isLinux = () => process.platform === "linux";
    var report = null;
    var getReport = () => {
      if (!report) {
        if (isLinux() && process.report) {
          const orig = process.report.excludeNetwork;
          process.report.excludeNetwork = true;
          report = process.report.getReport();
          process.report.excludeNetwork = orig;
        } else {
          report = {};
        }
      }
      return report;
    };
    module2.exports = { isLinux, getReport };
  }
});

// node_modules/detect-libc/lib/filesystem.js
var require_filesystem = __commonJS({
  "node_modules/detect-libc/lib/filesystem.js"(exports2, module2) {
    "use strict";
    var fs9 = require("fs");
    var LDD_PATH = "/usr/bin/ldd";
    var SELF_PATH = "/proc/self/exe";
    var MAX_LENGTH = 2048;
    var readFileSync = (path11) => {
      const fd = fs9.openSync(path11, "r");
      const buffer = Buffer.alloc(MAX_LENGTH);
      const bytesRead = fs9.readSync(fd, buffer, 0, MAX_LENGTH, 0);
      fs9.close(fd, () => {
      });
      return buffer.subarray(0, bytesRead);
    };
    var readFile = (path11) => new Promise((resolve, reject) => {
      fs9.open(path11, "r", (err, fd) => {
        if (err) {
          reject(err);
        } else {
          const buffer = Buffer.alloc(MAX_LENGTH);
          fs9.read(fd, buffer, 0, MAX_LENGTH, 0, (_, bytesRead) => {
            resolve(buffer.subarray(0, bytesRead));
            fs9.close(fd, () => {
            });
          });
        }
      });
    });
    module2.exports = {
      LDD_PATH,
      SELF_PATH,
      readFileSync,
      readFile
    };
  }
});

// node_modules/detect-libc/lib/elf.js
var require_elf = __commonJS({
  "node_modules/detect-libc/lib/elf.js"(exports2, module2) {
    "use strict";
    var interpreterPath = (elf) => {
      if (elf.length < 64) {
        return null;
      }
      if (elf.readUInt32BE(0) !== 2135247942) {
        return null;
      }
      if (elf.readUInt8(4) !== 2) {
        return null;
      }
      if (elf.readUInt8(5) !== 1) {
        return null;
      }
      const offset = elf.readUInt32LE(32);
      const size = elf.readUInt16LE(54);
      const count = elf.readUInt16LE(56);
      for (let i = 0; i < count; i++) {
        const headerOffset = offset + i * size;
        const type = elf.readUInt32LE(headerOffset);
        if (type === 3) {
          const fileOffset = elf.readUInt32LE(headerOffset + 8);
          const fileSize = elf.readUInt32LE(headerOffset + 32);
          return elf.subarray(fileOffset, fileOffset + fileSize).toString().replace(/\0.*$/g, "");
        }
      }
      return null;
    };
    module2.exports = {
      interpreterPath
    };
  }
});

// node_modules/detect-libc/lib/detect-libc.js
var require_detect_libc = __commonJS({
  "node_modules/detect-libc/lib/detect-libc.js"(exports2, module2) {
    "use strict";
    var childProcess = require("child_process");
    var { isLinux, getReport } = require_process();
    var { LDD_PATH, SELF_PATH, readFile, readFileSync } = require_filesystem();
    var { interpreterPath } = require_elf();
    var cachedFamilyInterpreter;
    var cachedFamilyFilesystem;
    var cachedVersionFilesystem;
    var command = "getconf GNU_LIBC_VERSION 2>&1 || true; ldd --version 2>&1 || true";
    var commandOut = "";
    var safeCommand = () => {
      if (!commandOut) {
        return new Promise((resolve) => {
          childProcess.exec(command, (err, out) => {
            commandOut = err ? " " : out;
            resolve(commandOut);
          });
        });
      }
      return commandOut;
    };
    var safeCommandSync = () => {
      if (!commandOut) {
        try {
          commandOut = childProcess.execSync(command, { encoding: "utf8" });
        } catch (_err) {
          commandOut = " ";
        }
      }
      return commandOut;
    };
    var GLIBC = "glibc";
    var RE_GLIBC_VERSION = /LIBC[a-z0-9 \-).]*?(\d+\.\d+)/i;
    var MUSL = "musl";
    var isFileMusl = (f) => f.includes("libc.musl-") || f.includes("ld-musl-");
    var familyFromReport = () => {
      const report = getReport();
      if (report.header && report.header.glibcVersionRuntime) {
        return GLIBC;
      }
      if (Array.isArray(report.sharedObjects)) {
        if (report.sharedObjects.some(isFileMusl)) {
          return MUSL;
        }
      }
      return null;
    };
    var familyFromCommand = (out) => {
      const [getconf, ldd1] = out.split(/[\r\n]+/);
      if (getconf && getconf.includes(GLIBC)) {
        return GLIBC;
      }
      if (ldd1 && ldd1.includes(MUSL)) {
        return MUSL;
      }
      return null;
    };
    var familyFromInterpreterPath = (path11) => {
      if (path11) {
        if (path11.includes("/ld-musl-")) {
          return MUSL;
        } else if (path11.includes("/ld-linux-")) {
          return GLIBC;
        }
      }
      return null;
    };
    var getFamilyFromLddContent = (content) => {
      content = content.toString();
      if (content.includes("musl")) {
        return MUSL;
      }
      if (content.includes("GNU C Library")) {
        return GLIBC;
      }
      return null;
    };
    var familyFromFilesystem = async () => {
      if (cachedFamilyFilesystem !== void 0) {
        return cachedFamilyFilesystem;
      }
      cachedFamilyFilesystem = null;
      try {
        const lddContent = await readFile(LDD_PATH);
        cachedFamilyFilesystem = getFamilyFromLddContent(lddContent);
      } catch (e) {
      }
      return cachedFamilyFilesystem;
    };
    var familyFromFilesystemSync = () => {
      if (cachedFamilyFilesystem !== void 0) {
        return cachedFamilyFilesystem;
      }
      cachedFamilyFilesystem = null;
      try {
        const lddContent = readFileSync(LDD_PATH);
        cachedFamilyFilesystem = getFamilyFromLddContent(lddContent);
      } catch (e) {
      }
      return cachedFamilyFilesystem;
    };
    var familyFromInterpreter = async () => {
      if (cachedFamilyInterpreter !== void 0) {
        return cachedFamilyInterpreter;
      }
      cachedFamilyInterpreter = null;
      try {
        const selfContent = await readFile(SELF_PATH);
        const path11 = interpreterPath(selfContent);
        cachedFamilyInterpreter = familyFromInterpreterPath(path11);
      } catch (e) {
      }
      return cachedFamilyInterpreter;
    };
    var familyFromInterpreterSync = () => {
      if (cachedFamilyInterpreter !== void 0) {
        return cachedFamilyInterpreter;
      }
      cachedFamilyInterpreter = null;
      try {
        const selfContent = readFileSync(SELF_PATH);
        const path11 = interpreterPath(selfContent);
        cachedFamilyInterpreter = familyFromInterpreterPath(path11);
      } catch (e) {
      }
      return cachedFamilyInterpreter;
    };
    var family = async () => {
      let family2 = null;
      if (isLinux()) {
        family2 = await familyFromInterpreter();
        if (!family2) {
          family2 = await familyFromFilesystem();
          if (!family2) {
            family2 = familyFromReport();
          }
          if (!family2) {
            const out = await safeCommand();
            family2 = familyFromCommand(out);
          }
        }
      }
      return family2;
    };
    var familySync = () => {
      let family2 = null;
      if (isLinux()) {
        family2 = familyFromInterpreterSync();
        if (!family2) {
          family2 = familyFromFilesystemSync();
          if (!family2) {
            family2 = familyFromReport();
          }
          if (!family2) {
            const out = safeCommandSync();
            family2 = familyFromCommand(out);
          }
        }
      }
      return family2;
    };
    var isNonGlibcLinux = async () => isLinux() && await family() !== GLIBC;
    var isNonGlibcLinuxSync = () => isLinux() && familySync() !== GLIBC;
    var versionFromFilesystem = async () => {
      if (cachedVersionFilesystem !== void 0) {
        return cachedVersionFilesystem;
      }
      cachedVersionFilesystem = null;
      try {
        const lddContent = await readFile(LDD_PATH);
        const versionMatch = lddContent.match(RE_GLIBC_VERSION);
        if (versionMatch) {
          cachedVersionFilesystem = versionMatch[1];
        }
      } catch (e) {
      }
      return cachedVersionFilesystem;
    };
    var versionFromFilesystemSync = () => {
      if (cachedVersionFilesystem !== void 0) {
        return cachedVersionFilesystem;
      }
      cachedVersionFilesystem = null;
      try {
        const lddContent = readFileSync(LDD_PATH);
        const versionMatch = lddContent.match(RE_GLIBC_VERSION);
        if (versionMatch) {
          cachedVersionFilesystem = versionMatch[1];
        }
      } catch (e) {
      }
      return cachedVersionFilesystem;
    };
    var versionFromReport = () => {
      const report = getReport();
      if (report.header && report.header.glibcVersionRuntime) {
        return report.header.glibcVersionRuntime;
      }
      return null;
    };
    var versionSuffix = (s) => s.trim().split(/\s+/)[1];
    var versionFromCommand = (out) => {
      const [getconf, ldd1, ldd2] = out.split(/[\r\n]+/);
      if (getconf && getconf.includes(GLIBC)) {
        return versionSuffix(getconf);
      }
      if (ldd1 && ldd2 && ldd1.includes(MUSL)) {
        return versionSuffix(ldd2);
      }
      return null;
    };
    var version = async () => {
      let version2 = null;
      if (isLinux()) {
        version2 = await versionFromFilesystem();
        if (!version2) {
          version2 = versionFromReport();
        }
        if (!version2) {
          const out = await safeCommand();
          version2 = versionFromCommand(out);
        }
      }
      return version2;
    };
    var versionSync = () => {
      let version2 = null;
      if (isLinux()) {
        version2 = versionFromFilesystemSync();
        if (!version2) {
          version2 = versionFromReport();
        }
        if (!version2) {
          const out = safeCommandSync();
          version2 = versionFromCommand(out);
        }
      }
      return version2;
    };
    module2.exports = {
      GLIBC,
      MUSL,
      family,
      familySync,
      isNonGlibcLinux,
      isNonGlibcLinuxSync,
      version,
      versionSync
    };
  }
});

// node_modules/sharp/node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "node_modules/sharp/node_modules/semver/internal/debug.js"(exports2, module2) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module2.exports = debug;
  }
});

// node_modules/sharp/node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "node_modules/sharp/node_modules/semver/internal/constants.js"(exports2, module2) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module2.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// node_modules/sharp/node_modules/semver/internal/re.js
var require_re = __commonJS({
  "node_modules/sharp/node_modules/semver/internal/re.js"(exports2, module2) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports2 = module2.exports = {};
    var re = exports2.re = [];
    var safeRe = exports2.safeRe = [];
    var src = exports2.src = [];
    var safeSrc = exports2.safeSrc = [];
    var t = exports2.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name, index, value);
      t[name] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports2.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports2.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports2.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// node_modules/sharp/node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "node_modules/sharp/node_modules/semver/internal/parse-options.js"(exports2, module2) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module2.exports = parseOptions;
  }
});

// node_modules/sharp/node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "node_modules/sharp/node_modules/semver/internal/identifiers.js"(exports2, module2) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a === b ? 0 : a < b ? -1 : 1;
      }
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module2.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// node_modules/sharp/node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "node_modules/sharp/node_modules/semver/classes/semver.js"(exports2, module2) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var SemVer = class _SemVer {
      constructor(version, options) {
        options = parseOptions(options);
        if (version instanceof _SemVer) {
          if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
            return version;
          } else {
            version = version.version;
          }
        } else if (typeof version !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
        }
        if (version.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version}`);
        }
        this.raw = version;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("build compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier) {
            const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
            if (!match || match[1] !== identifier) {
              throw new Error(`invalid identifier: ${identifier}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier, identifierBase);
            this.inc("pre", identifier, identifierBase);
            break;
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier, identifierBase);
            }
            this.inc("pre", identifier, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
                if (isNaN(this.prerelease[1])) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module2.exports = SemVer;
  }
});

// node_modules/sharp/node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "node_modules/sharp/node_modules/semver/functions/parse.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = (version, options, throwErrors = false) => {
      if (version instanceof SemVer) {
        return version;
      }
      try {
        return new SemVer(version, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module2.exports = parse;
  }
});

// node_modules/sharp/node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "node_modules/sharp/node_modules/semver/functions/coerce.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version, options) => {
      if (version instanceof SemVer) {
        return version;
      }
      if (typeof version === "number") {
        version = String(version);
      }
      if (typeof version !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || "0";
      const patch = match[4] || "0";
      const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
      const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    };
    module2.exports = coerce;
  }
});

// node_modules/sharp/node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "node_modules/sharp/node_modules/semver/functions/compare.js"(exports2, module2) {
    "use strict";
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module2.exports = compare;
  }
});

// node_modules/sharp/node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "node_modules/sharp/node_modules/semver/functions/gte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module2.exports = gte;
  }
});

// node_modules/sharp/node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  "node_modules/sharp/node_modules/semver/internal/lrucache.js"(exports2, module2) {
    "use strict";
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module2.exports = LRUCache;
  }
});

// node_modules/sharp/node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "node_modules/sharp/node_modules/semver/functions/eq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module2.exports = eq;
  }
});

// node_modules/sharp/node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "node_modules/sharp/node_modules/semver/functions/neq.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module2.exports = neq;
  }
});

// node_modules/sharp/node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "node_modules/sharp/node_modules/semver/functions/gt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module2.exports = gt;
  }
});

// node_modules/sharp/node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "node_modules/sharp/node_modules/semver/functions/lt.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module2.exports = lt;
  }
});

// node_modules/sharp/node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "node_modules/sharp/node_modules/semver/functions/lte.js"(exports2, module2) {
    "use strict";
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module2.exports = lte;
  }
});

// node_modules/sharp/node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "node_modules/sharp/node_modules/semver/functions/cmp.js"(exports2, module2) {
    "use strict";
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module2.exports = cmp;
  }
});

// node_modules/sharp/node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "node_modules/sharp/node_modules/semver/classes/comparator.js"(exports2, module2) {
    "use strict";
    var ANY = Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version) {
        debug("Comparator.test", version, this.options.loose);
        if (this.semver === ANY || version === ANY) {
          return true;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module2.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// node_modules/sharp/node_modules/semver/classes/range.js
var require_range = __commonJS({
  "node_modules/sharp/node_modules/semver/classes/range.js"(exports2, module2) {
    "use strict";
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = "";
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += "||";
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += " ";
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version) {
        if (!version) {
          return false;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module2.exports = Range;
    var LRU = require_lrucache();
    var cache = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      comp = comp.replace(re[t.BUILD], "");
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version)) {
          return false;
        }
      }
      if (version.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// node_modules/sharp/node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "node_modules/sharp/node_modules/semver/functions/satisfies.js"(exports2, module2) {
    "use strict";
    var Range = require_range();
    var satisfies = (version, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version);
    };
    module2.exports = satisfies;
  }
});

// node_modules/sharp/package.json
var require_package3 = __commonJS({
  "node_modules/sharp/package.json"(exports2, module2) {
    module2.exports = {
      name: "sharp",
      description: "High performance Node.js image processing, the fastest module to resize JPEG, PNG, WebP, GIF, AVIF and TIFF images",
      version: "0.34.5",
      author: "Lovell Fuller <npm@lovell.info>",
      homepage: "https://sharp.pixelplumbing.com",
      contributors: [
        "Pierre Inglebert <pierre.inglebert@gmail.com>",
        "Jonathan Ong <jonathanrichardong@gmail.com>",
        "Chanon Sajjamanochai <chanon.s@gmail.com>",
        "Juliano Julio <julianojulio@gmail.com>",
        "Daniel Gasienica <daniel@gasienica.ch>",
        "Julian Walker <julian@fiftythree.com>",
        "Amit Pitaru <pitaru.amit@gmail.com>",
        "Brandon Aaron <hello.brandon@aaron.sh>",
        "Andreas Lind <andreas@one.com>",
        "Maurus Cuelenaere <mcuelenaere@gmail.com>",
        "Linus Unneb\xE4ck <linus@folkdatorn.se>",
        "Victor Mateevitsi <mvictoras@gmail.com>",
        "Alaric Holloway <alaric.holloway@gmail.com>",
        "Bernhard K. Weisshuhn <bkw@codingforce.com>",
        "Chris Riley <criley@primedia.com>",
        "David Carley <dacarley@gmail.com>",
        "John Tobin <john@limelightmobileinc.com>",
        "Kenton Gray <kentongray@gmail.com>",
        "Felix B\xFCnemann <Felix.Buenemann@gmail.com>",
        "Samy Al Zahrani <samyalzahrany@gmail.com>",
        "Chintan Thakkar <lemnisk8@gmail.com>",
        "F. Orlando Galashan <frulo@gmx.de>",
        "Kleis Auke Wolthuizen <info@kleisauke.nl>",
        "Matt Hirsch <mhirsch@media.mit.edu>",
        "Matthias Thoemmes <thoemmes@gmail.com>",
        "Patrick Paskaris <patrick@paskaris.gr>",
        "J\xE9r\xE9my Lal <kapouer@melix.org>",
        "Rahul Nanwani <r.nanwani@gmail.com>",
        "Alice Monday <alice0meta@gmail.com>",
        "Kristo Jorgenson <kristo.jorgenson@gmail.com>",
        "YvesBos <yves_bos@outlook.com>",
        "Guy Maliar <guy@tailorbrands.com>",
        "Nicolas Coden <nicolas@ncoden.fr>",
        "Matt Parrish <matt.r.parrish@gmail.com>",
        "Marcel Bretschneider <marcel.bretschneider@gmail.com>",
        "Matthew McEachen <matthew+github@mceachen.org>",
        "Jarda Kot\u011B\u0161ovec <jarda.kotesovec@gmail.com>",
        "Kenric D'Souza <kenric.dsouza@gmail.com>",
        "Oleh Aleinyk <oleg.aleynik@gmail.com>",
        "Marcel Bretschneider <marcel.bretschneider@gmail.com>",
        "Andrea Bianco <andrea.bianco@unibas.ch>",
        "Rik Heywood <rik@rik.org>",
        "Thomas Parisot <hi@oncletom.io>",
        "Nathan Graves <nathanrgraves+github@gmail.com>",
        "Tom Lokhorst <tom@lokhorst.eu>",
        "Espen Hovlandsdal <espen@hovlandsdal.com>",
        "Sylvain Dumont <sylvain.dumont35@gmail.com>",
        "Alun Davies <alun.owain.davies@googlemail.com>",
        "Aidan Hoolachan <ajhoolachan21@gmail.com>",
        "Axel Eirola <axel.eirola@iki.fi>",
        "Freezy <freezy@xbmc.org>",
        "Daiz <taneli.vatanen@gmail.com>",
        "Julian Aubourg <j@ubourg.net>",
        "Keith Belovay <keith@picthrive.com>",
        "Michael B. Klein <mbklein@gmail.com>",
        "Jordan Prudhomme <jordan@raboland.fr>",
        "Ilya Ovdin <iovdin@gmail.com>",
        "Andargor <andargor@yahoo.com>",
        "Paul Neave <paul.neave@gmail.com>",
        "Brendan Kennedy <brenwken@gmail.com>",
        "Brychan Bennett-Odlum <git@brychan.io>",
        "Edward Silverton <e.silverton@gmail.com>",
        "Roman Malieiev <aromaleev@gmail.com>",
        "Tomas Szabo <tomas.szabo@deftomat.com>",
        "Robert O'Rourke <robert@o-rourke.org>",
        "Guillermo Alfonso Varela Chouci\xF1o <guillevch@gmail.com>",
        "Christian Flintrup <chr@gigahost.dk>",
        "Manan Jadhav <manan@motionden.com>",
        "Leon Radley <leon@radley.se>",
        "alza54 <alza54@thiocod.in>",
        "Jacob Smith <jacob@frende.me>",
        "Michael Nutt <michael@nutt.im>",
        "Brad Parham <baparham@gmail.com>",
        "Taneli Vatanen <taneli.vatanen@gmail.com>",
        "Joris Dugu\xE9 <zaruike10@gmail.com>",
        "Chris Banks <christopher.bradley.banks@gmail.com>",
        "Ompal Singh <ompal.hitm09@gmail.com>",
        "Brodan <christopher.hranj@gmail.com>",
        "Ankur Parihar <ankur.github@gmail.com>",
        "Brahim Ait elhaj <brahima@gmail.com>",
        "Mart Jansink <m.jansink@gmail.com>",
        "Lachlan Newman <lachnewman007@gmail.com>",
        "Dennis Beatty <dennis@dcbeatty.com>",
        "Ingvar Stepanyan <me@rreverser.com>",
        "Don Denton <don@happycollision.com>"
      ],
      scripts: {
        build: "node install/build.js",
        install: "node install/check.js || npm run build",
        clean: "rm -rf src/build/ .nyc_output/ coverage/ test/fixtures/output.*",
        test: "npm run lint && npm run test-unit",
        lint: "npm run lint-cpp && npm run lint-js && npm run lint-types",
        "lint-cpp": "cpplint --quiet src/*.h src/*.cc",
        "lint-js": "biome lint",
        "lint-types": "tsd --files ./test/types/sharp.test-d.ts",
        "test-leak": "./test/leak/leak.sh",
        "test-unit": "node --experimental-test-coverage test/unit.mjs",
        "package-from-local-build": "node npm/from-local-build.js",
        "package-release-notes": "node npm/release-notes.js",
        "docs-build": "node docs/build.mjs",
        "docs-serve": "cd docs && npm start",
        "docs-publish": "cd docs && npm run build && npx firebase-tools deploy --project pixelplumbing --only hosting:pixelplumbing-sharp"
      },
      type: "commonjs",
      main: "lib/index.js",
      types: "lib/index.d.ts",
      files: [
        "install",
        "lib",
        "src/*.{cc,h,gyp}"
      ],
      repository: {
        type: "git",
        url: "git://github.com/lovell/sharp.git"
      },
      keywords: [
        "jpeg",
        "png",
        "webp",
        "avif",
        "tiff",
        "gif",
        "svg",
        "jp2",
        "dzi",
        "image",
        "resize",
        "thumbnail",
        "crop",
        "embed",
        "libvips",
        "vips"
      ],
      dependencies: {
        "@img/colour": "^1.0.0",
        "detect-libc": "^2.1.2",
        semver: "^7.7.3"
      },
      optionalDependencies: {
        "@img/sharp-darwin-arm64": "0.34.5",
        "@img/sharp-darwin-x64": "0.34.5",
        "@img/sharp-libvips-darwin-arm64": "1.2.4",
        "@img/sharp-libvips-darwin-x64": "1.2.4",
        "@img/sharp-libvips-linux-arm": "1.2.4",
        "@img/sharp-libvips-linux-arm64": "1.2.4",
        "@img/sharp-libvips-linux-ppc64": "1.2.4",
        "@img/sharp-libvips-linux-riscv64": "1.2.4",
        "@img/sharp-libvips-linux-s390x": "1.2.4",
        "@img/sharp-libvips-linux-x64": "1.2.4",
        "@img/sharp-libvips-linuxmusl-arm64": "1.2.4",
        "@img/sharp-libvips-linuxmusl-x64": "1.2.4",
        "@img/sharp-linux-arm": "0.34.5",
        "@img/sharp-linux-arm64": "0.34.5",
        "@img/sharp-linux-ppc64": "0.34.5",
        "@img/sharp-linux-riscv64": "0.34.5",
        "@img/sharp-linux-s390x": "0.34.5",
        "@img/sharp-linux-x64": "0.34.5",
        "@img/sharp-linuxmusl-arm64": "0.34.5",
        "@img/sharp-linuxmusl-x64": "0.34.5",
        "@img/sharp-wasm32": "0.34.5",
        "@img/sharp-win32-arm64": "0.34.5",
        "@img/sharp-win32-ia32": "0.34.5",
        "@img/sharp-win32-x64": "0.34.5"
      },
      devDependencies: {
        "@biomejs/biome": "^2.3.4",
        "@cpplint/cli": "^0.1.0",
        "@emnapi/runtime": "^1.7.0",
        "@img/sharp-libvips-dev": "1.2.4",
        "@img/sharp-libvips-dev-wasm32": "1.2.4",
        "@img/sharp-libvips-win32-arm64": "1.2.4",
        "@img/sharp-libvips-win32-ia32": "1.2.4",
        "@img/sharp-libvips-win32-x64": "1.2.4",
        "@types/node": "*",
        emnapi: "^1.7.0",
        "exif-reader": "^2.0.2",
        "extract-zip": "^2.0.1",
        icc: "^3.0.0",
        "jsdoc-to-markdown": "^9.1.3",
        "node-addon-api": "^8.5.0",
        "node-gyp": "^11.5.0",
        "tar-fs": "^3.1.1",
        tsd: "^0.33.0"
      },
      license: "Apache-2.0",
      engines: {
        node: "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      config: {
        libvips: ">=8.17.3"
      },
      funding: {
        url: "https://opencollective.com/libvips"
      }
    };
  }
});

// node_modules/sharp/lib/libvips.js
var require_libvips = __commonJS({
  "node_modules/sharp/lib/libvips.js"(exports2, module2) {
    var { spawnSync } = require("node:child_process");
    var { createHash } = require("node:crypto");
    var semverCoerce = require_coerce();
    var semverGreaterThanOrEqualTo = require_gte();
    var semverSatisfies = require_satisfies();
    var detectLibc = require_detect_libc();
    var { config, engines, optionalDependencies } = require_package3();
    var minimumLibvipsVersionLabelled = process.env.npm_package_config_libvips || config.libvips;
    var minimumLibvipsVersion = semverCoerce(minimumLibvipsVersionLabelled).version;
    var prebuiltPlatforms = [
      "darwin-arm64",
      "darwin-x64",
      "linux-arm",
      "linux-arm64",
      "linux-ppc64",
      "linux-riscv64",
      "linux-s390x",
      "linux-x64",
      "linuxmusl-arm64",
      "linuxmusl-x64",
      "win32-arm64",
      "win32-ia32",
      "win32-x64"
    ];
    var spawnSyncOptions = {
      encoding: "utf8",
      shell: true
    };
    var log = (item) => {
      if (item instanceof Error) {
        console.error(`sharp: Installation error: ${item.message}`);
      } else {
        console.log(`sharp: ${item}`);
      }
    };
    var runtimeLibc = () => detectLibc.isNonGlibcLinuxSync() ? detectLibc.familySync() : "";
    var runtimePlatformArch = () => `${process.platform}${runtimeLibc()}-${process.arch}`;
    var buildPlatformArch = () => {
      if (isEmscripten()) {
        return "wasm32";
      }
      const { npm_config_arch, npm_config_platform, npm_config_libc } = process.env;
      const libc = typeof npm_config_libc === "string" ? npm_config_libc : runtimeLibc();
      return `${npm_config_platform || process.platform}${libc}-${npm_config_arch || process.arch}`;
    };
    var buildSharpLibvipsIncludeDir = () => {
      try {
        return require(`@img/sharp-libvips-dev-${buildPlatformArch()}/include`);
      } catch {
        try {
          return require("@img/sharp-libvips-dev/include");
        } catch {
        }
      }
      return "";
    };
    var buildSharpLibvipsCPlusPlusDir = () => {
      try {
        return require("@img/sharp-libvips-dev/cplusplus");
      } catch {
      }
      return "";
    };
    var buildSharpLibvipsLibDir = () => {
      try {
        return require(`@img/sharp-libvips-dev-${buildPlatformArch()}/lib`);
      } catch {
        try {
          return require(`@img/sharp-libvips-${buildPlatformArch()}/lib`);
        } catch {
        }
      }
      return "";
    };
    var isUnsupportedNodeRuntime = () => {
      if (process.release?.name === "node" && process.versions) {
        if (!semverSatisfies(process.versions.node, engines.node)) {
          return { found: process.versions.node, expected: engines.node };
        }
      }
    };
    var isEmscripten = () => {
      const { CC } = process.env;
      return Boolean(CC?.endsWith("/emcc"));
    };
    var isRosetta = () => {
      if (process.platform === "darwin" && process.arch === "x64") {
        const translated = spawnSync("sysctl sysctl.proc_translated", spawnSyncOptions).stdout;
        return (translated || "").trim() === "sysctl.proc_translated: 1";
      }
      return false;
    };
    var sha512 = (s) => createHash("sha512").update(s).digest("hex");
    var yarnLocator = () => {
      try {
        const identHash = sha512(`imgsharp-libvips-${buildPlatformArch()}`);
        const npmVersion = semverCoerce(optionalDependencies[`@img/sharp-libvips-${buildPlatformArch()}`], {
          includePrerelease: true
        }).version;
        return sha512(`${identHash}npm:${npmVersion}`).slice(0, 10);
      } catch {
      }
      return "";
    };
    var spawnRebuild = () => spawnSync(`node-gyp rebuild --directory=src ${isEmscripten() ? "--nodedir=emscripten" : ""}`, {
      ...spawnSyncOptions,
      stdio: "inherit"
    }).status;
    var globalLibvipsVersion = () => {
      if (process.platform !== "win32") {
        const globalLibvipsVersion2 = spawnSync("pkg-config --modversion vips-cpp", {
          ...spawnSyncOptions,
          env: {
            ...process.env,
            PKG_CONFIG_PATH: pkgConfigPath()
          }
        }).stdout;
        return (globalLibvipsVersion2 || "").trim();
      } else {
        return "";
      }
    };
    var pkgConfigPath = () => {
      if (process.platform !== "win32") {
        const brewPkgConfigPath = spawnSync(
          'which brew >/dev/null 2>&1 && brew environment --plain | grep PKG_CONFIG_LIBDIR | cut -d" " -f2',
          spawnSyncOptions
        ).stdout || "";
        return [
          brewPkgConfigPath.trim(),
          process.env.PKG_CONFIG_PATH,
          "/usr/local/lib/pkgconfig",
          "/usr/lib/pkgconfig",
          "/usr/local/libdata/pkgconfig",
          "/usr/libdata/pkgconfig"
        ].filter(Boolean).join(":");
      } else {
        return "";
      }
    };
    var skipSearch = (status, reason, logger) => {
      if (logger) {
        logger(`Detected ${reason}, skipping search for globally-installed libvips`);
      }
      return status;
    };
    var useGlobalLibvips = (logger) => {
      if (Boolean(process.env.SHARP_IGNORE_GLOBAL_LIBVIPS) === true) {
        return skipSearch(false, "SHARP_IGNORE_GLOBAL_LIBVIPS", logger);
      }
      if (Boolean(process.env.SHARP_FORCE_GLOBAL_LIBVIPS) === true) {
        return skipSearch(true, "SHARP_FORCE_GLOBAL_LIBVIPS", logger);
      }
      if (isRosetta()) {
        return skipSearch(false, "Rosetta", logger);
      }
      const globalVipsVersion = globalLibvipsVersion();
      return !!globalVipsVersion && semverGreaterThanOrEqualTo(globalVipsVersion, minimumLibvipsVersion);
    };
    module2.exports = {
      minimumLibvipsVersion,
      prebuiltPlatforms,
      buildPlatformArch,
      buildSharpLibvipsIncludeDir,
      buildSharpLibvipsCPlusPlusDir,
      buildSharpLibvipsLibDir,
      isUnsupportedNodeRuntime,
      runtimePlatformArch,
      log,
      yarnLocator,
      spawnRebuild,
      globalLibvipsVersion,
      pkgConfigPath,
      useGlobalLibvips
    };
  }
});

// node_modules/sharp/lib/sharp.js
var require_sharp = __commonJS({
  "node_modules/sharp/lib/sharp.js"(exports2, module2) {
    var { familySync, versionSync } = require_detect_libc();
    var { runtimePlatformArch, isUnsupportedNodeRuntime, prebuiltPlatforms, minimumLibvipsVersion } = require_libvips();
    var runtimePlatform = runtimePlatformArch();
    var paths = [
      `../src/build/Release/sharp-${runtimePlatform}.node`,
      "../src/build/Release/sharp-wasm32.node",
      `@img/sharp-${runtimePlatform}/sharp.node`,
      "@img/sharp-wasm32/sharp.node"
    ];
    var path11;
    var sharp3;
    var errors = [];
    for (path11 of paths) {
      try {
        sharp3 = require(path11);
        break;
      } catch (err) {
        errors.push(err);
      }
    }
    if (sharp3 && path11.startsWith("@img/sharp-linux-x64") && !sharp3._isUsingX64V2()) {
      const err = new Error("Prebuilt binaries for linux-x64 require v2 microarchitecture");
      err.code = "Unsupported CPU";
      errors.push(err);
      sharp3 = null;
    }
    if (sharp3) {
      module2.exports = sharp3;
    } else {
      const [isLinux, isMacOs, isWindows] = ["linux", "darwin", "win32"].map((os) => runtimePlatform.startsWith(os));
      const help = [`Could not load the "sharp" module using the ${runtimePlatform} runtime`];
      errors.forEach((err) => {
        if (err.code !== "MODULE_NOT_FOUND") {
          help.push(`${err.code}: ${err.message}`);
        }
      });
      const messages = errors.map((err) => err.message).join(" ");
      help.push("Possible solutions:");
      if (isUnsupportedNodeRuntime()) {
        const { found, expected } = isUnsupportedNodeRuntime();
        help.push(
          "- Please upgrade Node.js:",
          `    Found ${found}`,
          `    Requires ${expected}`
        );
      } else if (prebuiltPlatforms.includes(runtimePlatform)) {
        const [os, cpu] = runtimePlatform.split("-");
        const libc = os.endsWith("musl") ? " --libc=musl" : "";
        help.push(
          "- Ensure optional dependencies can be installed:",
          "    npm install --include=optional sharp",
          "- Ensure your package manager supports multi-platform installation:",
          "    See https://sharp.pixelplumbing.com/install#cross-platform",
          "- Add platform-specific dependencies:",
          `    npm install --os=${os.replace("musl", "")}${libc} --cpu=${cpu} sharp`
        );
      } else {
        help.push(
          `- Manually install libvips >= ${minimumLibvipsVersion}`,
          "- Add experimental WebAssembly-based dependencies:",
          "    npm install --cpu=wasm32 sharp",
          "    npm install @img/sharp-wasm32"
        );
      }
      if (isLinux && /(symbol not found|CXXABI_)/i.test(messages)) {
        try {
          const { config } = require(`@img/sharp-libvips-${runtimePlatform}/package`);
          const libcFound = `${familySync()} ${versionSync()}`;
          const libcRequires = `${config.musl ? "musl" : "glibc"} ${config.musl || config.glibc}`;
          help.push(
            "- Update your OS:",
            `    Found ${libcFound}`,
            `    Requires ${libcRequires}`
          );
        } catch (_errEngines) {
        }
      }
      if (isLinux && /\/snap\/core[0-9]{2}/.test(messages)) {
        help.push(
          "- Remove the Node.js Snap, which does not support native modules",
          "    snap remove node"
        );
      }
      if (isMacOs && /Incompatible library version/.test(messages)) {
        help.push(
          "- Update Homebrew:",
          "    brew update && brew upgrade vips"
        );
      }
      if (errors.some((err) => err.code === "ERR_DLOPEN_DISABLED")) {
        help.push("- Run Node.js without using the --no-addons flag");
      }
      if (isWindows && /The specified procedure could not be found/.test(messages)) {
        help.push(
          "- Using the canvas package on Windows?",
          "    See https://sharp.pixelplumbing.com/install#canvas-and-windows",
          "- Check for outdated versions of sharp in the dependency tree:",
          "    npm ls sharp"
        );
      }
      help.push(
        "- Consult the installation documentation:",
        "    See https://sharp.pixelplumbing.com/install"
      );
      throw new Error(help.join("\n"));
    }
  }
});

// node_modules/sharp/lib/constructor.js
var require_constructor = __commonJS({
  "node_modules/sharp/lib/constructor.js"(exports2, module2) {
    var util = require("node:util");
    var stream = require("node:stream");
    var is = require_is();
    require_sharp();
    var debuglog = util.debuglog("sharp");
    var queueListener = (queueLength) => {
      Sharp.queue.emit("change", queueLength);
    };
    var Sharp = function(input, options) {
      if (arguments.length === 1 && !is.defined(input)) {
        throw new Error("Invalid input");
      }
      if (!(this instanceof Sharp)) {
        return new Sharp(input, options);
      }
      stream.Duplex.call(this);
      this.options = {
        // resize options
        topOffsetPre: -1,
        leftOffsetPre: -1,
        widthPre: -1,
        heightPre: -1,
        topOffsetPost: -1,
        leftOffsetPost: -1,
        widthPost: -1,
        heightPost: -1,
        width: -1,
        height: -1,
        canvas: "crop",
        position: 0,
        resizeBackground: [0, 0, 0, 255],
        angle: 0,
        rotationAngle: 0,
        rotationBackground: [0, 0, 0, 255],
        rotateBefore: false,
        orientBefore: false,
        flip: false,
        flop: false,
        extendTop: 0,
        extendBottom: 0,
        extendLeft: 0,
        extendRight: 0,
        extendBackground: [0, 0, 0, 255],
        extendWith: "background",
        withoutEnlargement: false,
        withoutReduction: false,
        affineMatrix: [],
        affineBackground: [0, 0, 0, 255],
        affineIdx: 0,
        affineIdy: 0,
        affineOdx: 0,
        affineOdy: 0,
        affineInterpolator: this.constructor.interpolators.bilinear,
        kernel: "lanczos3",
        fastShrinkOnLoad: true,
        // operations
        tint: [-1, 0, 0, 0],
        flatten: false,
        flattenBackground: [0, 0, 0],
        unflatten: false,
        negate: false,
        negateAlpha: true,
        medianSize: 0,
        blurSigma: 0,
        precision: "integer",
        minAmpl: 0.2,
        sharpenSigma: 0,
        sharpenM1: 1,
        sharpenM2: 2,
        sharpenX1: 2,
        sharpenY2: 10,
        sharpenY3: 20,
        threshold: 0,
        thresholdGrayscale: true,
        trimBackground: [],
        trimThreshold: -1,
        trimLineArt: false,
        dilateWidth: 0,
        erodeWidth: 0,
        gamma: 0,
        gammaOut: 0,
        greyscale: false,
        normalise: false,
        normaliseLower: 1,
        normaliseUpper: 99,
        claheWidth: 0,
        claheHeight: 0,
        claheMaxSlope: 3,
        brightness: 1,
        saturation: 1,
        hue: 0,
        lightness: 0,
        booleanBufferIn: null,
        booleanFileIn: "",
        joinChannelIn: [],
        extractChannel: -1,
        removeAlpha: false,
        ensureAlpha: -1,
        colourspace: "srgb",
        colourspacePipeline: "last",
        composite: [],
        // output
        fileOut: "",
        formatOut: "input",
        streamOut: false,
        keepMetadata: 0,
        withMetadataOrientation: -1,
        withMetadataDensity: 0,
        withIccProfile: "",
        withExif: {},
        withExifMerge: true,
        withXmp: "",
        resolveWithObject: false,
        loop: -1,
        delay: [],
        // output format
        jpegQuality: 80,
        jpegProgressive: false,
        jpegChromaSubsampling: "4:2:0",
        jpegTrellisQuantisation: false,
        jpegOvershootDeringing: false,
        jpegOptimiseScans: false,
        jpegOptimiseCoding: true,
        jpegQuantisationTable: 0,
        pngProgressive: false,
        pngCompressionLevel: 6,
        pngAdaptiveFiltering: false,
        pngPalette: false,
        pngQuality: 100,
        pngEffort: 7,
        pngBitdepth: 8,
        pngDither: 1,
        jp2Quality: 80,
        jp2TileHeight: 512,
        jp2TileWidth: 512,
        jp2Lossless: false,
        jp2ChromaSubsampling: "4:4:4",
        webpQuality: 80,
        webpAlphaQuality: 100,
        webpLossless: false,
        webpNearLossless: false,
        webpSmartSubsample: false,
        webpSmartDeblock: false,
        webpPreset: "default",
        webpEffort: 4,
        webpMinSize: false,
        webpMixed: false,
        gifBitdepth: 8,
        gifEffort: 7,
        gifDither: 1,
        gifInterFrameMaxError: 0,
        gifInterPaletteMaxError: 3,
        gifKeepDuplicateFrames: false,
        gifReuse: true,
        gifProgressive: false,
        tiffQuality: 80,
        tiffCompression: "jpeg",
        tiffBigtiff: false,
        tiffPredictor: "horizontal",
        tiffPyramid: false,
        tiffMiniswhite: false,
        tiffBitdepth: 8,
        tiffTile: false,
        tiffTileHeight: 256,
        tiffTileWidth: 256,
        tiffXres: 1,
        tiffYres: 1,
        tiffResolutionUnit: "inch",
        heifQuality: 50,
        heifLossless: false,
        heifCompression: "av1",
        heifEffort: 4,
        heifChromaSubsampling: "4:4:4",
        heifBitdepth: 8,
        jxlDistance: 1,
        jxlDecodingTier: 0,
        jxlEffort: 7,
        jxlLossless: false,
        rawDepth: "uchar",
        tileSize: 256,
        tileOverlap: 0,
        tileContainer: "fs",
        tileLayout: "dz",
        tileFormat: "last",
        tileDepth: "last",
        tileAngle: 0,
        tileSkipBlanks: -1,
        tileBackground: [255, 255, 255, 255],
        tileCentre: false,
        tileId: "https://example.com/iiif",
        tileBasename: "",
        timeoutSeconds: 0,
        linearA: [],
        linearB: [],
        pdfBackground: [255, 255, 255, 255],
        // Function to notify of libvips warnings
        debuglog: (warning) => {
          this.emit("warning", warning);
          debuglog(warning);
        },
        // Function to notify of queue length changes
        queueListener
      };
      this.options.input = this._createInputDescriptor(input, options, { allowStream: true });
      return this;
    };
    Object.setPrototypeOf(Sharp.prototype, stream.Duplex.prototype);
    Object.setPrototypeOf(Sharp, stream.Duplex);
    function clone() {
      const clone2 = this.constructor.call();
      const { debuglog: debuglog2, queueListener: queueListener2, ...options } = this.options;
      clone2.options = structuredClone(options);
      clone2.options.debuglog = debuglog2;
      clone2.options.queueListener = queueListener2;
      if (this._isStreamInput()) {
        this.on("finish", () => {
          this._flattenBufferIn();
          clone2.options.input.buffer = this.options.input.buffer;
          clone2.emit("finish");
        });
      }
      return clone2;
    }
    Object.assign(Sharp.prototype, { clone });
    module2.exports = Sharp;
  }
});

// node_modules/sharp/lib/input.js
var require_input = __commonJS({
  "node_modules/sharp/lib/input.js"(exports2, module2) {
    var is = require_is();
    var sharp3 = require_sharp();
    var align = {
      left: "low",
      top: "low",
      low: "low",
      center: "centre",
      centre: "centre",
      right: "high",
      bottom: "high",
      high: "high"
    };
    var inputStreamParameters = [
      // Limits and error handling
      "failOn",
      "limitInputPixels",
      "unlimited",
      // Format-generic
      "animated",
      "autoOrient",
      "density",
      "ignoreIcc",
      "page",
      "pages",
      "sequentialRead",
      // Format-specific
      "jp2",
      "openSlide",
      "pdf",
      "raw",
      "svg",
      "tiff",
      // Deprecated
      "failOnError",
      "openSlideLevel",
      "pdfBackground",
      "tiffSubifd"
    ];
    function _inputOptionsFromObject(obj) {
      const params = inputStreamParameters.filter((p) => is.defined(obj[p])).map((p) => [p, obj[p]]);
      return params.length ? Object.fromEntries(params) : void 0;
    }
    function _createInputDescriptor(input, inputOptions, containerOptions) {
      const inputDescriptor = {
        autoOrient: false,
        failOn: "warning",
        limitInputPixels: 16383 ** 2,
        ignoreIcc: false,
        unlimited: false,
        sequentialRead: true
      };
      if (is.string(input)) {
        inputDescriptor.file = input;
      } else if (is.buffer(input)) {
        if (input.length === 0) {
          throw Error("Input Buffer is empty");
        }
        inputDescriptor.buffer = input;
      } else if (is.arrayBuffer(input)) {
        if (input.byteLength === 0) {
          throw Error("Input bit Array is empty");
        }
        inputDescriptor.buffer = Buffer.from(input, 0, input.byteLength);
      } else if (is.typedArray(input)) {
        if (input.length === 0) {
          throw Error("Input Bit Array is empty");
        }
        inputDescriptor.buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
      } else if (is.plainObject(input) && !is.defined(inputOptions)) {
        inputOptions = input;
        if (_inputOptionsFromObject(inputOptions)) {
          inputDescriptor.buffer = [];
        }
      } else if (!is.defined(input) && !is.defined(inputOptions) && is.object(containerOptions) && containerOptions.allowStream) {
        inputDescriptor.buffer = [];
      } else if (Array.isArray(input)) {
        if (input.length > 1) {
          if (!this.options.joining) {
            this.options.joining = true;
            this.options.join = input.map((i) => this._createInputDescriptor(i));
          } else {
            throw new Error("Recursive join is unsupported");
          }
        } else {
          throw new Error("Expected at least two images to join");
        }
      } else {
        throw new Error(`Unsupported input '${input}' of type ${typeof input}${is.defined(inputOptions) ? ` when also providing options of type ${typeof inputOptions}` : ""}`);
      }
      if (is.object(inputOptions)) {
        if (is.defined(inputOptions.failOnError)) {
          if (is.bool(inputOptions.failOnError)) {
            inputDescriptor.failOn = inputOptions.failOnError ? "warning" : "none";
          } else {
            throw is.invalidParameterError("failOnError", "boolean", inputOptions.failOnError);
          }
        }
        if (is.defined(inputOptions.failOn)) {
          if (is.string(inputOptions.failOn) && is.inArray(inputOptions.failOn, ["none", "truncated", "error", "warning"])) {
            inputDescriptor.failOn = inputOptions.failOn;
          } else {
            throw is.invalidParameterError("failOn", "one of: none, truncated, error, warning", inputOptions.failOn);
          }
        }
        if (is.defined(inputOptions.autoOrient)) {
          if (is.bool(inputOptions.autoOrient)) {
            inputDescriptor.autoOrient = inputOptions.autoOrient;
          } else {
            throw is.invalidParameterError("autoOrient", "boolean", inputOptions.autoOrient);
          }
        }
        if (is.defined(inputOptions.density)) {
          if (is.inRange(inputOptions.density, 1, 1e5)) {
            inputDescriptor.density = inputOptions.density;
          } else {
            throw is.invalidParameterError("density", "number between 1 and 100000", inputOptions.density);
          }
        }
        if (is.defined(inputOptions.ignoreIcc)) {
          if (is.bool(inputOptions.ignoreIcc)) {
            inputDescriptor.ignoreIcc = inputOptions.ignoreIcc;
          } else {
            throw is.invalidParameterError("ignoreIcc", "boolean", inputOptions.ignoreIcc);
          }
        }
        if (is.defined(inputOptions.limitInputPixels)) {
          if (is.bool(inputOptions.limitInputPixels)) {
            inputDescriptor.limitInputPixels = inputOptions.limitInputPixels ? 16383 ** 2 : 0;
          } else if (is.integer(inputOptions.limitInputPixels) && is.inRange(inputOptions.limitInputPixels, 0, Number.MAX_SAFE_INTEGER)) {
            inputDescriptor.limitInputPixels = inputOptions.limitInputPixels;
          } else {
            throw is.invalidParameterError("limitInputPixels", "positive integer", inputOptions.limitInputPixels);
          }
        }
        if (is.defined(inputOptions.unlimited)) {
          if (is.bool(inputOptions.unlimited)) {
            inputDescriptor.unlimited = inputOptions.unlimited;
          } else {
            throw is.invalidParameterError("unlimited", "boolean", inputOptions.unlimited);
          }
        }
        if (is.defined(inputOptions.sequentialRead)) {
          if (is.bool(inputOptions.sequentialRead)) {
            inputDescriptor.sequentialRead = inputOptions.sequentialRead;
          } else {
            throw is.invalidParameterError("sequentialRead", "boolean", inputOptions.sequentialRead);
          }
        }
        if (is.defined(inputOptions.raw)) {
          if (is.object(inputOptions.raw) && is.integer(inputOptions.raw.width) && inputOptions.raw.width > 0 && is.integer(inputOptions.raw.height) && inputOptions.raw.height > 0 && is.integer(inputOptions.raw.channels) && is.inRange(inputOptions.raw.channels, 1, 4)) {
            inputDescriptor.rawWidth = inputOptions.raw.width;
            inputDescriptor.rawHeight = inputOptions.raw.height;
            inputDescriptor.rawChannels = inputOptions.raw.channels;
            switch (input.constructor) {
              case Uint8Array:
              case Uint8ClampedArray:
                inputDescriptor.rawDepth = "uchar";
                break;
              case Int8Array:
                inputDescriptor.rawDepth = "char";
                break;
              case Uint16Array:
                inputDescriptor.rawDepth = "ushort";
                break;
              case Int16Array:
                inputDescriptor.rawDepth = "short";
                break;
              case Uint32Array:
                inputDescriptor.rawDepth = "uint";
                break;
              case Int32Array:
                inputDescriptor.rawDepth = "int";
                break;
              case Float32Array:
                inputDescriptor.rawDepth = "float";
                break;
              case Float64Array:
                inputDescriptor.rawDepth = "double";
                break;
              default:
                inputDescriptor.rawDepth = "uchar";
                break;
            }
          } else {
            throw new Error("Expected width, height and channels for raw pixel input");
          }
          inputDescriptor.rawPremultiplied = false;
          if (is.defined(inputOptions.raw.premultiplied)) {
            if (is.bool(inputOptions.raw.premultiplied)) {
              inputDescriptor.rawPremultiplied = inputOptions.raw.premultiplied;
            } else {
              throw is.invalidParameterError("raw.premultiplied", "boolean", inputOptions.raw.premultiplied);
            }
          }
          inputDescriptor.rawPageHeight = 0;
          if (is.defined(inputOptions.raw.pageHeight)) {
            if (is.integer(inputOptions.raw.pageHeight) && inputOptions.raw.pageHeight > 0 && inputOptions.raw.pageHeight <= inputOptions.raw.height) {
              if (inputOptions.raw.height % inputOptions.raw.pageHeight !== 0) {
                throw new Error(`Expected raw.height ${inputOptions.raw.height} to be a multiple of raw.pageHeight ${inputOptions.raw.pageHeight}`);
              }
              inputDescriptor.rawPageHeight = inputOptions.raw.pageHeight;
            } else {
              throw is.invalidParameterError("raw.pageHeight", "positive integer", inputOptions.raw.pageHeight);
            }
          }
        }
        if (is.defined(inputOptions.animated)) {
          if (is.bool(inputOptions.animated)) {
            inputDescriptor.pages = inputOptions.animated ? -1 : 1;
          } else {
            throw is.invalidParameterError("animated", "boolean", inputOptions.animated);
          }
        }
        if (is.defined(inputOptions.pages)) {
          if (is.integer(inputOptions.pages) && is.inRange(inputOptions.pages, -1, 1e5)) {
            inputDescriptor.pages = inputOptions.pages;
          } else {
            throw is.invalidParameterError("pages", "integer between -1 and 100000", inputOptions.pages);
          }
        }
        if (is.defined(inputOptions.page)) {
          if (is.integer(inputOptions.page) && is.inRange(inputOptions.page, 0, 1e5)) {
            inputDescriptor.page = inputOptions.page;
          } else {
            throw is.invalidParameterError("page", "integer between 0 and 100000", inputOptions.page);
          }
        }
        if (is.object(inputOptions.openSlide) && is.defined(inputOptions.openSlide.level)) {
          if (is.integer(inputOptions.openSlide.level) && is.inRange(inputOptions.openSlide.level, 0, 256)) {
            inputDescriptor.openSlideLevel = inputOptions.openSlide.level;
          } else {
            throw is.invalidParameterError("openSlide.level", "integer between 0 and 256", inputOptions.openSlide.level);
          }
        } else if (is.defined(inputOptions.level)) {
          if (is.integer(inputOptions.level) && is.inRange(inputOptions.level, 0, 256)) {
            inputDescriptor.openSlideLevel = inputOptions.level;
          } else {
            throw is.invalidParameterError("level", "integer between 0 and 256", inputOptions.level);
          }
        }
        if (is.object(inputOptions.tiff) && is.defined(inputOptions.tiff.subifd)) {
          if (is.integer(inputOptions.tiff.subifd) && is.inRange(inputOptions.tiff.subifd, -1, 1e5)) {
            inputDescriptor.tiffSubifd = inputOptions.tiff.subifd;
          } else {
            throw is.invalidParameterError("tiff.subifd", "integer between -1 and 100000", inputOptions.tiff.subifd);
          }
        } else if (is.defined(inputOptions.subifd)) {
          if (is.integer(inputOptions.subifd) && is.inRange(inputOptions.subifd, -1, 1e5)) {
            inputDescriptor.tiffSubifd = inputOptions.subifd;
          } else {
            throw is.invalidParameterError("subifd", "integer between -1 and 100000", inputOptions.subifd);
          }
        }
        if (is.object(inputOptions.svg)) {
          if (is.defined(inputOptions.svg.stylesheet)) {
            if (is.string(inputOptions.svg.stylesheet)) {
              inputDescriptor.svgStylesheet = inputOptions.svg.stylesheet;
            } else {
              throw is.invalidParameterError("svg.stylesheet", "string", inputOptions.svg.stylesheet);
            }
          }
          if (is.defined(inputOptions.svg.highBitdepth)) {
            if (is.bool(inputOptions.svg.highBitdepth)) {
              inputDescriptor.svgHighBitdepth = inputOptions.svg.highBitdepth;
            } else {
              throw is.invalidParameterError("svg.highBitdepth", "boolean", inputOptions.svg.highBitdepth);
            }
          }
        }
        if (is.object(inputOptions.pdf) && is.defined(inputOptions.pdf.background)) {
          inputDescriptor.pdfBackground = this._getBackgroundColourOption(inputOptions.pdf.background);
        } else if (is.defined(inputOptions.pdfBackground)) {
          inputDescriptor.pdfBackground = this._getBackgroundColourOption(inputOptions.pdfBackground);
        }
        if (is.object(inputOptions.jp2) && is.defined(inputOptions.jp2.oneshot)) {
          if (is.bool(inputOptions.jp2.oneshot)) {
            inputDescriptor.jp2Oneshot = inputOptions.jp2.oneshot;
          } else {
            throw is.invalidParameterError("jp2.oneshot", "boolean", inputOptions.jp2.oneshot);
          }
        }
        if (is.defined(inputOptions.create)) {
          if (is.object(inputOptions.create) && is.integer(inputOptions.create.width) && inputOptions.create.width > 0 && is.integer(inputOptions.create.height) && inputOptions.create.height > 0 && is.integer(inputOptions.create.channels)) {
            inputDescriptor.createWidth = inputOptions.create.width;
            inputDescriptor.createHeight = inputOptions.create.height;
            inputDescriptor.createChannels = inputOptions.create.channels;
            inputDescriptor.createPageHeight = 0;
            if (is.defined(inputOptions.create.pageHeight)) {
              if (is.integer(inputOptions.create.pageHeight) && inputOptions.create.pageHeight > 0 && inputOptions.create.pageHeight <= inputOptions.create.height) {
                if (inputOptions.create.height % inputOptions.create.pageHeight !== 0) {
                  throw new Error(`Expected create.height ${inputOptions.create.height} to be a multiple of create.pageHeight ${inputOptions.create.pageHeight}`);
                }
                inputDescriptor.createPageHeight = inputOptions.create.pageHeight;
              } else {
                throw is.invalidParameterError("create.pageHeight", "positive integer", inputOptions.create.pageHeight);
              }
            }
            if (is.defined(inputOptions.create.noise)) {
              if (!is.object(inputOptions.create.noise)) {
                throw new Error("Expected noise to be an object");
              }
              if (inputOptions.create.noise.type !== "gaussian") {
                throw new Error("Only gaussian noise is supported at the moment");
              }
              inputDescriptor.createNoiseType = inputOptions.create.noise.type;
              if (!is.inRange(inputOptions.create.channels, 1, 4)) {
                throw is.invalidParameterError("create.channels", "number between 1 and 4", inputOptions.create.channels);
              }
              inputDescriptor.createNoiseMean = 128;
              if (is.defined(inputOptions.create.noise.mean)) {
                if (is.number(inputOptions.create.noise.mean) && is.inRange(inputOptions.create.noise.mean, 0, 1e4)) {
                  inputDescriptor.createNoiseMean = inputOptions.create.noise.mean;
                } else {
                  throw is.invalidParameterError("create.noise.mean", "number between 0 and 10000", inputOptions.create.noise.mean);
                }
              }
              inputDescriptor.createNoiseSigma = 30;
              if (is.defined(inputOptions.create.noise.sigma)) {
                if (is.number(inputOptions.create.noise.sigma) && is.inRange(inputOptions.create.noise.sigma, 0, 1e4)) {
                  inputDescriptor.createNoiseSigma = inputOptions.create.noise.sigma;
                } else {
                  throw is.invalidParameterError("create.noise.sigma", "number between 0 and 10000", inputOptions.create.noise.sigma);
                }
              }
            } else if (is.defined(inputOptions.create.background)) {
              if (!is.inRange(inputOptions.create.channels, 3, 4)) {
                throw is.invalidParameterError("create.channels", "number between 3 and 4", inputOptions.create.channels);
              }
              inputDescriptor.createBackground = this._getBackgroundColourOption(inputOptions.create.background);
            } else {
              throw new Error("Expected valid noise or background to create a new input image");
            }
            delete inputDescriptor.buffer;
          } else {
            throw new Error("Expected valid width, height and channels to create a new input image");
          }
        }
        if (is.defined(inputOptions.text)) {
          if (is.object(inputOptions.text) && is.string(inputOptions.text.text)) {
            inputDescriptor.textValue = inputOptions.text.text;
            if (is.defined(inputOptions.text.height) && is.defined(inputOptions.text.dpi)) {
              throw new Error("Expected only one of dpi or height");
            }
            if (is.defined(inputOptions.text.font)) {
              if (is.string(inputOptions.text.font)) {
                inputDescriptor.textFont = inputOptions.text.font;
              } else {
                throw is.invalidParameterError("text.font", "string", inputOptions.text.font);
              }
            }
            if (is.defined(inputOptions.text.fontfile)) {
              if (is.string(inputOptions.text.fontfile)) {
                inputDescriptor.textFontfile = inputOptions.text.fontfile;
              } else {
                throw is.invalidParameterError("text.fontfile", "string", inputOptions.text.fontfile);
              }
            }
            if (is.defined(inputOptions.text.width)) {
              if (is.integer(inputOptions.text.width) && inputOptions.text.width > 0) {
                inputDescriptor.textWidth = inputOptions.text.width;
              } else {
                throw is.invalidParameterError("text.width", "positive integer", inputOptions.text.width);
              }
            }
            if (is.defined(inputOptions.text.height)) {
              if (is.integer(inputOptions.text.height) && inputOptions.text.height > 0) {
                inputDescriptor.textHeight = inputOptions.text.height;
              } else {
                throw is.invalidParameterError("text.height", "positive integer", inputOptions.text.height);
              }
            }
            if (is.defined(inputOptions.text.align)) {
              if (is.string(inputOptions.text.align) && is.string(this.constructor.align[inputOptions.text.align])) {
                inputDescriptor.textAlign = this.constructor.align[inputOptions.text.align];
              } else {
                throw is.invalidParameterError("text.align", "valid alignment", inputOptions.text.align);
              }
            }
            if (is.defined(inputOptions.text.justify)) {
              if (is.bool(inputOptions.text.justify)) {
                inputDescriptor.textJustify = inputOptions.text.justify;
              } else {
                throw is.invalidParameterError("text.justify", "boolean", inputOptions.text.justify);
              }
            }
            if (is.defined(inputOptions.text.dpi)) {
              if (is.integer(inputOptions.text.dpi) && is.inRange(inputOptions.text.dpi, 1, 1e6)) {
                inputDescriptor.textDpi = inputOptions.text.dpi;
              } else {
                throw is.invalidParameterError("text.dpi", "integer between 1 and 1000000", inputOptions.text.dpi);
              }
            }
            if (is.defined(inputOptions.text.rgba)) {
              if (is.bool(inputOptions.text.rgba)) {
                inputDescriptor.textRgba = inputOptions.text.rgba;
              } else {
                throw is.invalidParameterError("text.rgba", "bool", inputOptions.text.rgba);
              }
            }
            if (is.defined(inputOptions.text.spacing)) {
              if (is.integer(inputOptions.text.spacing) && is.inRange(inputOptions.text.spacing, -1e6, 1e6)) {
                inputDescriptor.textSpacing = inputOptions.text.spacing;
              } else {
                throw is.invalidParameterError("text.spacing", "integer between -1000000 and 1000000", inputOptions.text.spacing);
              }
            }
            if (is.defined(inputOptions.text.wrap)) {
              if (is.string(inputOptions.text.wrap) && is.inArray(inputOptions.text.wrap, ["word", "char", "word-char", "none"])) {
                inputDescriptor.textWrap = inputOptions.text.wrap;
              } else {
                throw is.invalidParameterError("text.wrap", "one of: word, char, word-char, none", inputOptions.text.wrap);
              }
            }
            delete inputDescriptor.buffer;
          } else {
            throw new Error("Expected a valid string to create an image with text.");
          }
        }
        if (is.defined(inputOptions.join)) {
          if (is.defined(this.options.join)) {
            if (is.defined(inputOptions.join.animated)) {
              if (is.bool(inputOptions.join.animated)) {
                inputDescriptor.joinAnimated = inputOptions.join.animated;
              } else {
                throw is.invalidParameterError("join.animated", "boolean", inputOptions.join.animated);
              }
            }
            if (is.defined(inputOptions.join.across)) {
              if (is.integer(inputOptions.join.across) && is.inRange(inputOptions.join.across, 1, 1e6)) {
                inputDescriptor.joinAcross = inputOptions.join.across;
              } else {
                throw is.invalidParameterError("join.across", "integer between 1 and 100000", inputOptions.join.across);
              }
            }
            if (is.defined(inputOptions.join.shim)) {
              if (is.integer(inputOptions.join.shim) && is.inRange(inputOptions.join.shim, 0, 1e6)) {
                inputDescriptor.joinShim = inputOptions.join.shim;
              } else {
                throw is.invalidParameterError("join.shim", "integer between 0 and 100000", inputOptions.join.shim);
              }
            }
            if (is.defined(inputOptions.join.background)) {
              inputDescriptor.joinBackground = this._getBackgroundColourOption(inputOptions.join.background);
            }
            if (is.defined(inputOptions.join.halign)) {
              if (is.string(inputOptions.join.halign) && is.string(this.constructor.align[inputOptions.join.halign])) {
                inputDescriptor.joinHalign = this.constructor.align[inputOptions.join.halign];
              } else {
                throw is.invalidParameterError("join.halign", "valid alignment", inputOptions.join.halign);
              }
            }
            if (is.defined(inputOptions.join.valign)) {
              if (is.string(inputOptions.join.valign) && is.string(this.constructor.align[inputOptions.join.valign])) {
                inputDescriptor.joinValign = this.constructor.align[inputOptions.join.valign];
              } else {
                throw is.invalidParameterError("join.valign", "valid alignment", inputOptions.join.valign);
              }
            }
          } else {
            throw new Error("Expected input to be an array of images to join");
          }
        }
      } else if (is.defined(inputOptions)) {
        throw new Error(`Invalid input options ${inputOptions}`);
      }
      return inputDescriptor;
    }
    function _write(chunk, _encoding, callback) {
      if (Array.isArray(this.options.input.buffer)) {
        if (is.buffer(chunk)) {
          if (this.options.input.buffer.length === 0) {
            this.on("finish", () => {
              this.streamInFinished = true;
            });
          }
          this.options.input.buffer.push(chunk);
          callback();
        } else {
          callback(new Error("Non-Buffer data on Writable Stream"));
        }
      } else {
        callback(new Error("Unexpected data on Writable Stream"));
      }
    }
    function _flattenBufferIn() {
      if (this._isStreamInput()) {
        this.options.input.buffer = Buffer.concat(this.options.input.buffer);
      }
    }
    function _isStreamInput() {
      return Array.isArray(this.options.input.buffer);
    }
    function metadata(callback) {
      const stack = Error();
      if (is.fn(callback)) {
        if (this._isStreamInput()) {
          this.on("finish", () => {
            this._flattenBufferIn();
            sharp3.metadata(this.options, (err, metadata2) => {
              if (err) {
                callback(is.nativeError(err, stack));
              } else {
                callback(null, metadata2);
              }
            });
          });
        } else {
          sharp3.metadata(this.options, (err, metadata2) => {
            if (err) {
              callback(is.nativeError(err, stack));
            } else {
              callback(null, metadata2);
            }
          });
        }
        return this;
      } else {
        if (this._isStreamInput()) {
          return new Promise((resolve, reject) => {
            const finished = () => {
              this._flattenBufferIn();
              sharp3.metadata(this.options, (err, metadata2) => {
                if (err) {
                  reject(is.nativeError(err, stack));
                } else {
                  resolve(metadata2);
                }
              });
            };
            if (this.writableFinished) {
              finished();
            } else {
              this.once("finish", finished);
            }
          });
        } else {
          return new Promise((resolve, reject) => {
            sharp3.metadata(this.options, (err, metadata2) => {
              if (err) {
                reject(is.nativeError(err, stack));
              } else {
                resolve(metadata2);
              }
            });
          });
        }
      }
    }
    function stats(callback) {
      const stack = Error();
      if (is.fn(callback)) {
        if (this._isStreamInput()) {
          this.on("finish", () => {
            this._flattenBufferIn();
            sharp3.stats(this.options, (err, stats2) => {
              if (err) {
                callback(is.nativeError(err, stack));
              } else {
                callback(null, stats2);
              }
            });
          });
        } else {
          sharp3.stats(this.options, (err, stats2) => {
            if (err) {
              callback(is.nativeError(err, stack));
            } else {
              callback(null, stats2);
            }
          });
        }
        return this;
      } else {
        if (this._isStreamInput()) {
          return new Promise((resolve, reject) => {
            this.on("finish", function() {
              this._flattenBufferIn();
              sharp3.stats(this.options, (err, stats2) => {
                if (err) {
                  reject(is.nativeError(err, stack));
                } else {
                  resolve(stats2);
                }
              });
            });
          });
        } else {
          return new Promise((resolve, reject) => {
            sharp3.stats(this.options, (err, stats2) => {
              if (err) {
                reject(is.nativeError(err, stack));
              } else {
                resolve(stats2);
              }
            });
          });
        }
      }
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        // Private
        _inputOptionsFromObject,
        _createInputDescriptor,
        _write,
        _flattenBufferIn,
        _isStreamInput,
        // Public
        metadata,
        stats
      });
      Sharp.align = align;
    };
  }
});

// node_modules/sharp/lib/resize.js
var require_resize = __commonJS({
  "node_modules/sharp/lib/resize.js"(exports2, module2) {
    var is = require_is();
    var gravity = {
      center: 0,
      centre: 0,
      north: 1,
      east: 2,
      south: 3,
      west: 4,
      northeast: 5,
      southeast: 6,
      southwest: 7,
      northwest: 8
    };
    var position = {
      top: 1,
      right: 2,
      bottom: 3,
      left: 4,
      "right top": 5,
      "right bottom": 6,
      "left bottom": 7,
      "left top": 8
    };
    var extendWith = {
      background: "background",
      copy: "copy",
      repeat: "repeat",
      mirror: "mirror"
    };
    var strategy = {
      entropy: 16,
      attention: 17
    };
    var kernel = {
      nearest: "nearest",
      linear: "linear",
      cubic: "cubic",
      mitchell: "mitchell",
      lanczos2: "lanczos2",
      lanczos3: "lanczos3",
      mks2013: "mks2013",
      mks2021: "mks2021"
    };
    var fit = {
      contain: "contain",
      cover: "cover",
      fill: "fill",
      inside: "inside",
      outside: "outside"
    };
    var mapFitToCanvas = {
      contain: "embed",
      cover: "crop",
      fill: "ignore_aspect",
      inside: "max",
      outside: "min"
    };
    function isRotationExpected(options) {
      return options.angle % 360 !== 0 || options.rotationAngle !== 0;
    }
    function isResizeExpected(options) {
      return options.width !== -1 || options.height !== -1;
    }
    function resize(widthOrOptions, height, options) {
      if (isResizeExpected(this.options)) {
        this.options.debuglog("ignoring previous resize options");
      }
      if (this.options.widthPost !== -1) {
        this.options.debuglog("operation order will be: extract, resize, extract");
      }
      if (is.defined(widthOrOptions)) {
        if (is.object(widthOrOptions) && !is.defined(options)) {
          options = widthOrOptions;
        } else if (is.integer(widthOrOptions) && widthOrOptions > 0) {
          this.options.width = widthOrOptions;
        } else {
          throw is.invalidParameterError("width", "positive integer", widthOrOptions);
        }
      } else {
        this.options.width = -1;
      }
      if (is.defined(height)) {
        if (is.integer(height) && height > 0) {
          this.options.height = height;
        } else {
          throw is.invalidParameterError("height", "positive integer", height);
        }
      } else {
        this.options.height = -1;
      }
      if (is.object(options)) {
        if (is.defined(options.width)) {
          if (is.integer(options.width) && options.width > 0) {
            this.options.width = options.width;
          } else {
            throw is.invalidParameterError("width", "positive integer", options.width);
          }
        }
        if (is.defined(options.height)) {
          if (is.integer(options.height) && options.height > 0) {
            this.options.height = options.height;
          } else {
            throw is.invalidParameterError("height", "positive integer", options.height);
          }
        }
        if (is.defined(options.fit)) {
          const canvas = mapFitToCanvas[options.fit];
          if (is.string(canvas)) {
            this.options.canvas = canvas;
          } else {
            throw is.invalidParameterError("fit", "valid fit", options.fit);
          }
        }
        if (is.defined(options.position)) {
          const pos = is.integer(options.position) ? options.position : strategy[options.position] || position[options.position] || gravity[options.position];
          if (is.integer(pos) && (is.inRange(pos, 0, 8) || is.inRange(pos, 16, 17))) {
            this.options.position = pos;
          } else {
            throw is.invalidParameterError("position", "valid position/gravity/strategy", options.position);
          }
        }
        this._setBackgroundColourOption("resizeBackground", options.background);
        if (is.defined(options.kernel)) {
          if (is.string(kernel[options.kernel])) {
            this.options.kernel = kernel[options.kernel];
          } else {
            throw is.invalidParameterError("kernel", "valid kernel name", options.kernel);
          }
        }
        if (is.defined(options.withoutEnlargement)) {
          this._setBooleanOption("withoutEnlargement", options.withoutEnlargement);
        }
        if (is.defined(options.withoutReduction)) {
          this._setBooleanOption("withoutReduction", options.withoutReduction);
        }
        if (is.defined(options.fastShrinkOnLoad)) {
          this._setBooleanOption("fastShrinkOnLoad", options.fastShrinkOnLoad);
        }
      }
      if (isRotationExpected(this.options) && isResizeExpected(this.options)) {
        this.options.rotateBefore = true;
      }
      return this;
    }
    function extend(extend2) {
      if (is.integer(extend2) && extend2 > 0) {
        this.options.extendTop = extend2;
        this.options.extendBottom = extend2;
        this.options.extendLeft = extend2;
        this.options.extendRight = extend2;
      } else if (is.object(extend2)) {
        if (is.defined(extend2.top)) {
          if (is.integer(extend2.top) && extend2.top >= 0) {
            this.options.extendTop = extend2.top;
          } else {
            throw is.invalidParameterError("top", "positive integer", extend2.top);
          }
        }
        if (is.defined(extend2.bottom)) {
          if (is.integer(extend2.bottom) && extend2.bottom >= 0) {
            this.options.extendBottom = extend2.bottom;
          } else {
            throw is.invalidParameterError("bottom", "positive integer", extend2.bottom);
          }
        }
        if (is.defined(extend2.left)) {
          if (is.integer(extend2.left) && extend2.left >= 0) {
            this.options.extendLeft = extend2.left;
          } else {
            throw is.invalidParameterError("left", "positive integer", extend2.left);
          }
        }
        if (is.defined(extend2.right)) {
          if (is.integer(extend2.right) && extend2.right >= 0) {
            this.options.extendRight = extend2.right;
          } else {
            throw is.invalidParameterError("right", "positive integer", extend2.right);
          }
        }
        this._setBackgroundColourOption("extendBackground", extend2.background);
        if (is.defined(extend2.extendWith)) {
          if (is.string(extendWith[extend2.extendWith])) {
            this.options.extendWith = extendWith[extend2.extendWith];
          } else {
            throw is.invalidParameterError("extendWith", "one of: background, copy, repeat, mirror", extend2.extendWith);
          }
        }
      } else {
        throw is.invalidParameterError("extend", "integer or object", extend2);
      }
      return this;
    }
    function extract(options) {
      const suffix = isResizeExpected(this.options) || this.options.widthPre !== -1 ? "Post" : "Pre";
      if (this.options[`width${suffix}`] !== -1) {
        this.options.debuglog("ignoring previous extract options");
      }
      ["left", "top", "width", "height"].forEach(function(name) {
        const value = options[name];
        if (is.integer(value) && value >= 0) {
          this.options[name + (name === "left" || name === "top" ? "Offset" : "") + suffix] = value;
        } else {
          throw is.invalidParameterError(name, "integer", value);
        }
      }, this);
      if (isRotationExpected(this.options) && !isResizeExpected(this.options)) {
        if (this.options.widthPre === -1 || this.options.widthPost === -1) {
          this.options.rotateBefore = true;
        }
      }
      if (this.options.input.autoOrient) {
        this.options.orientBefore = true;
      }
      return this;
    }
    function trim(options) {
      this.options.trimThreshold = 10;
      if (is.defined(options)) {
        if (is.object(options)) {
          if (is.defined(options.background)) {
            this._setBackgroundColourOption("trimBackground", options.background);
          }
          if (is.defined(options.threshold)) {
            if (is.number(options.threshold) && options.threshold >= 0) {
              this.options.trimThreshold = options.threshold;
            } else {
              throw is.invalidParameterError("threshold", "positive number", options.threshold);
            }
          }
          if (is.defined(options.lineArt)) {
            this._setBooleanOption("trimLineArt", options.lineArt);
          }
        } else {
          throw is.invalidParameterError("trim", "object", options);
        }
      }
      if (isRotationExpected(this.options)) {
        this.options.rotateBefore = true;
      }
      return this;
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        resize,
        extend,
        extract,
        trim
      });
      Sharp.gravity = gravity;
      Sharp.strategy = strategy;
      Sharp.kernel = kernel;
      Sharp.fit = fit;
      Sharp.position = position;
    };
  }
});

// node_modules/sharp/lib/composite.js
var require_composite = __commonJS({
  "node_modules/sharp/lib/composite.js"(exports2, module2) {
    var is = require_is();
    var blend = {
      clear: "clear",
      source: "source",
      over: "over",
      in: "in",
      out: "out",
      atop: "atop",
      dest: "dest",
      "dest-over": "dest-over",
      "dest-in": "dest-in",
      "dest-out": "dest-out",
      "dest-atop": "dest-atop",
      xor: "xor",
      add: "add",
      saturate: "saturate",
      multiply: "multiply",
      screen: "screen",
      overlay: "overlay",
      darken: "darken",
      lighten: "lighten",
      "colour-dodge": "colour-dodge",
      "color-dodge": "colour-dodge",
      "colour-burn": "colour-burn",
      "color-burn": "colour-burn",
      "hard-light": "hard-light",
      "soft-light": "soft-light",
      difference: "difference",
      exclusion: "exclusion"
    };
    function composite(images) {
      if (!Array.isArray(images)) {
        throw is.invalidParameterError("images to composite", "array", images);
      }
      this.options.composite = images.map((image) => {
        if (!is.object(image)) {
          throw is.invalidParameterError("image to composite", "object", image);
        }
        const inputOptions = this._inputOptionsFromObject(image);
        const composite2 = {
          input: this._createInputDescriptor(image.input, inputOptions, { allowStream: false }),
          blend: "over",
          tile: false,
          left: 0,
          top: 0,
          hasOffset: false,
          gravity: 0,
          premultiplied: false
        };
        if (is.defined(image.blend)) {
          if (is.string(blend[image.blend])) {
            composite2.blend = blend[image.blend];
          } else {
            throw is.invalidParameterError("blend", "valid blend name", image.blend);
          }
        }
        if (is.defined(image.tile)) {
          if (is.bool(image.tile)) {
            composite2.tile = image.tile;
          } else {
            throw is.invalidParameterError("tile", "boolean", image.tile);
          }
        }
        if (is.defined(image.left)) {
          if (is.integer(image.left)) {
            composite2.left = image.left;
          } else {
            throw is.invalidParameterError("left", "integer", image.left);
          }
        }
        if (is.defined(image.top)) {
          if (is.integer(image.top)) {
            composite2.top = image.top;
          } else {
            throw is.invalidParameterError("top", "integer", image.top);
          }
        }
        if (is.defined(image.top) !== is.defined(image.left)) {
          throw new Error("Expected both left and top to be set");
        } else {
          composite2.hasOffset = is.integer(image.top) && is.integer(image.left);
        }
        if (is.defined(image.gravity)) {
          if (is.integer(image.gravity) && is.inRange(image.gravity, 0, 8)) {
            composite2.gravity = image.gravity;
          } else if (is.string(image.gravity) && is.integer(this.constructor.gravity[image.gravity])) {
            composite2.gravity = this.constructor.gravity[image.gravity];
          } else {
            throw is.invalidParameterError("gravity", "valid gravity", image.gravity);
          }
        }
        if (is.defined(image.premultiplied)) {
          if (is.bool(image.premultiplied)) {
            composite2.premultiplied = image.premultiplied;
          } else {
            throw is.invalidParameterError("premultiplied", "boolean", image.premultiplied);
          }
        }
        return composite2;
      });
      return this;
    }
    module2.exports = (Sharp) => {
      Sharp.prototype.composite = composite;
      Sharp.blend = blend;
    };
  }
});

// node_modules/sharp/lib/operation.js
var require_operation = __commonJS({
  "node_modules/sharp/lib/operation.js"(exports2, module2) {
    var is = require_is();
    var vipsPrecision = {
      integer: "integer",
      float: "float",
      approximate: "approximate"
    };
    function rotate(angle, options) {
      if (!is.defined(angle)) {
        return this.autoOrient();
      }
      if (this.options.angle || this.options.rotationAngle) {
        this.options.debuglog("ignoring previous rotate options");
        this.options.angle = 0;
        this.options.rotationAngle = 0;
      }
      if (is.integer(angle) && !(angle % 90)) {
        this.options.angle = angle;
      } else if (is.number(angle)) {
        this.options.rotationAngle = angle;
        if (is.object(options) && options.background) {
          this._setBackgroundColourOption("rotationBackground", options.background);
        }
      } else {
        throw is.invalidParameterError("angle", "numeric", angle);
      }
      return this;
    }
    function autoOrient() {
      this.options.input.autoOrient = true;
      return this;
    }
    function flip(flip2) {
      this.options.flip = is.bool(flip2) ? flip2 : true;
      return this;
    }
    function flop(flop2) {
      this.options.flop = is.bool(flop2) ? flop2 : true;
      return this;
    }
    function affine(matrix, options) {
      const flatMatrix = [].concat(...matrix);
      if (flatMatrix.length === 4 && flatMatrix.every(is.number)) {
        this.options.affineMatrix = flatMatrix;
      } else {
        throw is.invalidParameterError("matrix", "1x4 or 2x2 array", matrix);
      }
      if (is.defined(options)) {
        if (is.object(options)) {
          this._setBackgroundColourOption("affineBackground", options.background);
          if (is.defined(options.idx)) {
            if (is.number(options.idx)) {
              this.options.affineIdx = options.idx;
            } else {
              throw is.invalidParameterError("options.idx", "number", options.idx);
            }
          }
          if (is.defined(options.idy)) {
            if (is.number(options.idy)) {
              this.options.affineIdy = options.idy;
            } else {
              throw is.invalidParameterError("options.idy", "number", options.idy);
            }
          }
          if (is.defined(options.odx)) {
            if (is.number(options.odx)) {
              this.options.affineOdx = options.odx;
            } else {
              throw is.invalidParameterError("options.odx", "number", options.odx);
            }
          }
          if (is.defined(options.ody)) {
            if (is.number(options.ody)) {
              this.options.affineOdy = options.ody;
            } else {
              throw is.invalidParameterError("options.ody", "number", options.ody);
            }
          }
          if (is.defined(options.interpolator)) {
            if (is.inArray(options.interpolator, Object.values(this.constructor.interpolators))) {
              this.options.affineInterpolator = options.interpolator;
            } else {
              throw is.invalidParameterError("options.interpolator", "valid interpolator name", options.interpolator);
            }
          }
        } else {
          throw is.invalidParameterError("options", "object", options);
        }
      }
      return this;
    }
    function sharpen(options, flat, jagged) {
      if (!is.defined(options)) {
        this.options.sharpenSigma = -1;
      } else if (is.bool(options)) {
        this.options.sharpenSigma = options ? -1 : 0;
      } else if (is.number(options) && is.inRange(options, 0.01, 1e4)) {
        this.options.sharpenSigma = options;
        if (is.defined(flat)) {
          if (is.number(flat) && is.inRange(flat, 0, 1e4)) {
            this.options.sharpenM1 = flat;
          } else {
            throw is.invalidParameterError("flat", "number between 0 and 10000", flat);
          }
        }
        if (is.defined(jagged)) {
          if (is.number(jagged) && is.inRange(jagged, 0, 1e4)) {
            this.options.sharpenM2 = jagged;
          } else {
            throw is.invalidParameterError("jagged", "number between 0 and 10000", jagged);
          }
        }
      } else if (is.plainObject(options)) {
        if (is.number(options.sigma) && is.inRange(options.sigma, 1e-6, 10)) {
          this.options.sharpenSigma = options.sigma;
        } else {
          throw is.invalidParameterError("options.sigma", "number between 0.000001 and 10", options.sigma);
        }
        if (is.defined(options.m1)) {
          if (is.number(options.m1) && is.inRange(options.m1, 0, 1e6)) {
            this.options.sharpenM1 = options.m1;
          } else {
            throw is.invalidParameterError("options.m1", "number between 0 and 1000000", options.m1);
          }
        }
        if (is.defined(options.m2)) {
          if (is.number(options.m2) && is.inRange(options.m2, 0, 1e6)) {
            this.options.sharpenM2 = options.m2;
          } else {
            throw is.invalidParameterError("options.m2", "number between 0 and 1000000", options.m2);
          }
        }
        if (is.defined(options.x1)) {
          if (is.number(options.x1) && is.inRange(options.x1, 0, 1e6)) {
            this.options.sharpenX1 = options.x1;
          } else {
            throw is.invalidParameterError("options.x1", "number between 0 and 1000000", options.x1);
          }
        }
        if (is.defined(options.y2)) {
          if (is.number(options.y2) && is.inRange(options.y2, 0, 1e6)) {
            this.options.sharpenY2 = options.y2;
          } else {
            throw is.invalidParameterError("options.y2", "number between 0 and 1000000", options.y2);
          }
        }
        if (is.defined(options.y3)) {
          if (is.number(options.y3) && is.inRange(options.y3, 0, 1e6)) {
            this.options.sharpenY3 = options.y3;
          } else {
            throw is.invalidParameterError("options.y3", "number between 0 and 1000000", options.y3);
          }
        }
      } else {
        throw is.invalidParameterError("sigma", "number between 0.01 and 10000", options);
      }
      return this;
    }
    function median(size) {
      if (!is.defined(size)) {
        this.options.medianSize = 3;
      } else if (is.integer(size) && is.inRange(size, 1, 1e3)) {
        this.options.medianSize = size;
      } else {
        throw is.invalidParameterError("size", "integer between 1 and 1000", size);
      }
      return this;
    }
    function blur(options) {
      let sigma;
      if (is.number(options)) {
        sigma = options;
      } else if (is.plainObject(options)) {
        if (!is.number(options.sigma)) {
          throw is.invalidParameterError("options.sigma", "number between 0.3 and 1000", sigma);
        }
        sigma = options.sigma;
        if ("precision" in options) {
          if (is.string(vipsPrecision[options.precision])) {
            this.options.precision = vipsPrecision[options.precision];
          } else {
            throw is.invalidParameterError("precision", "one of: integer, float, approximate", options.precision);
          }
        }
        if ("minAmplitude" in options) {
          if (is.number(options.minAmplitude) && is.inRange(options.minAmplitude, 1e-3, 1)) {
            this.options.minAmpl = options.minAmplitude;
          } else {
            throw is.invalidParameterError("minAmplitude", "number between 0.001 and 1", options.minAmplitude);
          }
        }
      }
      if (!is.defined(options)) {
        this.options.blurSigma = -1;
      } else if (is.bool(options)) {
        this.options.blurSigma = options ? -1 : 0;
      } else if (is.number(sigma) && is.inRange(sigma, 0.3, 1e3)) {
        this.options.blurSigma = sigma;
      } else {
        throw is.invalidParameterError("sigma", "number between 0.3 and 1000", sigma);
      }
      return this;
    }
    function dilate(width) {
      if (!is.defined(width)) {
        this.options.dilateWidth = 1;
      } else if (is.integer(width) && width > 0) {
        this.options.dilateWidth = width;
      } else {
        throw is.invalidParameterError("dilate", "positive integer", dilate);
      }
      return this;
    }
    function erode(width) {
      if (!is.defined(width)) {
        this.options.erodeWidth = 1;
      } else if (is.integer(width) && width > 0) {
        this.options.erodeWidth = width;
      } else {
        throw is.invalidParameterError("erode", "positive integer", erode);
      }
      return this;
    }
    function flatten(options) {
      this.options.flatten = is.bool(options) ? options : true;
      if (is.object(options)) {
        this._setBackgroundColourOption("flattenBackground", options.background);
      }
      return this;
    }
    function unflatten() {
      this.options.unflatten = true;
      return this;
    }
    function gamma(gamma2, gammaOut) {
      if (!is.defined(gamma2)) {
        this.options.gamma = 2.2;
      } else if (is.number(gamma2) && is.inRange(gamma2, 1, 3)) {
        this.options.gamma = gamma2;
      } else {
        throw is.invalidParameterError("gamma", "number between 1.0 and 3.0", gamma2);
      }
      if (!is.defined(gammaOut)) {
        this.options.gammaOut = this.options.gamma;
      } else if (is.number(gammaOut) && is.inRange(gammaOut, 1, 3)) {
        this.options.gammaOut = gammaOut;
      } else {
        throw is.invalidParameterError("gammaOut", "number between 1.0 and 3.0", gammaOut);
      }
      return this;
    }
    function negate(options) {
      this.options.negate = is.bool(options) ? options : true;
      if (is.plainObject(options) && "alpha" in options) {
        if (!is.bool(options.alpha)) {
          throw is.invalidParameterError("alpha", "should be boolean value", options.alpha);
        } else {
          this.options.negateAlpha = options.alpha;
        }
      }
      return this;
    }
    function normalise(options) {
      if (is.plainObject(options)) {
        if (is.defined(options.lower)) {
          if (is.number(options.lower) && is.inRange(options.lower, 0, 99)) {
            this.options.normaliseLower = options.lower;
          } else {
            throw is.invalidParameterError("lower", "number between 0 and 99", options.lower);
          }
        }
        if (is.defined(options.upper)) {
          if (is.number(options.upper) && is.inRange(options.upper, 1, 100)) {
            this.options.normaliseUpper = options.upper;
          } else {
            throw is.invalidParameterError("upper", "number between 1 and 100", options.upper);
          }
        }
      }
      if (this.options.normaliseLower >= this.options.normaliseUpper) {
        throw is.invalidParameterError(
          "range",
          "lower to be less than upper",
          `${this.options.normaliseLower} >= ${this.options.normaliseUpper}`
        );
      }
      this.options.normalise = true;
      return this;
    }
    function normalize(options) {
      return this.normalise(options);
    }
    function clahe(options) {
      if (is.plainObject(options)) {
        if (is.integer(options.width) && options.width > 0) {
          this.options.claheWidth = options.width;
        } else {
          throw is.invalidParameterError("width", "integer greater than zero", options.width);
        }
        if (is.integer(options.height) && options.height > 0) {
          this.options.claheHeight = options.height;
        } else {
          throw is.invalidParameterError("height", "integer greater than zero", options.height);
        }
        if (is.defined(options.maxSlope)) {
          if (is.integer(options.maxSlope) && is.inRange(options.maxSlope, 0, 100)) {
            this.options.claheMaxSlope = options.maxSlope;
          } else {
            throw is.invalidParameterError("maxSlope", "integer between 0 and 100", options.maxSlope);
          }
        }
      } else {
        throw is.invalidParameterError("options", "plain object", options);
      }
      return this;
    }
    function convolve(kernel) {
      if (!is.object(kernel) || !Array.isArray(kernel.kernel) || !is.integer(kernel.width) || !is.integer(kernel.height) || !is.inRange(kernel.width, 3, 1001) || !is.inRange(kernel.height, 3, 1001) || kernel.height * kernel.width !== kernel.kernel.length) {
        throw new Error("Invalid convolution kernel");
      }
      if (!is.integer(kernel.scale)) {
        kernel.scale = kernel.kernel.reduce((a, b) => a + b, 0);
      }
      if (kernel.scale < 1) {
        kernel.scale = 1;
      }
      if (!is.integer(kernel.offset)) {
        kernel.offset = 0;
      }
      this.options.convKernel = kernel;
      return this;
    }
    function threshold(threshold2, options) {
      if (!is.defined(threshold2)) {
        this.options.threshold = 128;
      } else if (is.bool(threshold2)) {
        this.options.threshold = threshold2 ? 128 : 0;
      } else if (is.integer(threshold2) && is.inRange(threshold2, 0, 255)) {
        this.options.threshold = threshold2;
      } else {
        throw is.invalidParameterError("threshold", "integer between 0 and 255", threshold2);
      }
      if (!is.object(options) || options.greyscale === true || options.grayscale === true) {
        this.options.thresholdGrayscale = true;
      } else {
        this.options.thresholdGrayscale = false;
      }
      return this;
    }
    function boolean(operand, operator, options) {
      this.options.boolean = this._createInputDescriptor(operand, options);
      if (is.string(operator) && is.inArray(operator, ["and", "or", "eor"])) {
        this.options.booleanOp = operator;
      } else {
        throw is.invalidParameterError("operator", "one of: and, or, eor", operator);
      }
      return this;
    }
    function linear(a, b) {
      if (!is.defined(a) && is.number(b)) {
        a = 1;
      } else if (is.number(a) && !is.defined(b)) {
        b = 0;
      }
      if (!is.defined(a)) {
        this.options.linearA = [];
      } else if (is.number(a)) {
        this.options.linearA = [a];
      } else if (Array.isArray(a) && a.length && a.every(is.number)) {
        this.options.linearA = a;
      } else {
        throw is.invalidParameterError("a", "number or array of numbers", a);
      }
      if (!is.defined(b)) {
        this.options.linearB = [];
      } else if (is.number(b)) {
        this.options.linearB = [b];
      } else if (Array.isArray(b) && b.length && b.every(is.number)) {
        this.options.linearB = b;
      } else {
        throw is.invalidParameterError("b", "number or array of numbers", b);
      }
      if (this.options.linearA.length !== this.options.linearB.length) {
        throw new Error("Expected a and b to be arrays of the same length");
      }
      return this;
    }
    function recomb(inputMatrix) {
      if (!Array.isArray(inputMatrix)) {
        throw is.invalidParameterError("inputMatrix", "array", inputMatrix);
      }
      if (inputMatrix.length !== 3 && inputMatrix.length !== 4) {
        throw is.invalidParameterError("inputMatrix", "3x3 or 4x4 array", inputMatrix.length);
      }
      const recombMatrix = inputMatrix.flat().map(Number);
      if (recombMatrix.length !== 9 && recombMatrix.length !== 16) {
        throw is.invalidParameterError("inputMatrix", "cardinality of 9 or 16", recombMatrix.length);
      }
      this.options.recombMatrix = recombMatrix;
      return this;
    }
    function modulate(options) {
      if (!is.plainObject(options)) {
        throw is.invalidParameterError("options", "plain object", options);
      }
      if ("brightness" in options) {
        if (is.number(options.brightness) && options.brightness >= 0) {
          this.options.brightness = options.brightness;
        } else {
          throw is.invalidParameterError("brightness", "number above zero", options.brightness);
        }
      }
      if ("saturation" in options) {
        if (is.number(options.saturation) && options.saturation >= 0) {
          this.options.saturation = options.saturation;
        } else {
          throw is.invalidParameterError("saturation", "number above zero", options.saturation);
        }
      }
      if ("hue" in options) {
        if (is.integer(options.hue)) {
          this.options.hue = options.hue % 360;
        } else {
          throw is.invalidParameterError("hue", "number", options.hue);
        }
      }
      if ("lightness" in options) {
        if (is.number(options.lightness)) {
          this.options.lightness = options.lightness;
        } else {
          throw is.invalidParameterError("lightness", "number", options.lightness);
        }
      }
      return this;
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        autoOrient,
        rotate,
        flip,
        flop,
        affine,
        sharpen,
        erode,
        dilate,
        median,
        blur,
        flatten,
        unflatten,
        gamma,
        negate,
        normalise,
        normalize,
        clahe,
        convolve,
        threshold,
        boolean,
        linear,
        recomb,
        modulate
      });
    };
  }
});

// node_modules/@img/colour/color.cjs
var require_color = __commonJS({
  "node_modules/@img/colour/color.cjs"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export(index_exports, {
      default: () => index_default
    });
    module2.exports = __toCommonJS(index_exports);
    var color_name_default = {
      aliceblue: [240, 248, 255],
      antiquewhite: [250, 235, 215],
      aqua: [0, 255, 255],
      aquamarine: [127, 255, 212],
      azure: [240, 255, 255],
      beige: [245, 245, 220],
      bisque: [255, 228, 196],
      black: [0, 0, 0],
      blanchedalmond: [255, 235, 205],
      blue: [0, 0, 255],
      blueviolet: [138, 43, 226],
      brown: [165, 42, 42],
      burlywood: [222, 184, 135],
      cadetblue: [95, 158, 160],
      chartreuse: [127, 255, 0],
      chocolate: [210, 105, 30],
      coral: [255, 127, 80],
      cornflowerblue: [100, 149, 237],
      cornsilk: [255, 248, 220],
      crimson: [220, 20, 60],
      cyan: [0, 255, 255],
      darkblue: [0, 0, 139],
      darkcyan: [0, 139, 139],
      darkgoldenrod: [184, 134, 11],
      darkgray: [169, 169, 169],
      darkgreen: [0, 100, 0],
      darkgrey: [169, 169, 169],
      darkkhaki: [189, 183, 107],
      darkmagenta: [139, 0, 139],
      darkolivegreen: [85, 107, 47],
      darkorange: [255, 140, 0],
      darkorchid: [153, 50, 204],
      darkred: [139, 0, 0],
      darksalmon: [233, 150, 122],
      darkseagreen: [143, 188, 143],
      darkslateblue: [72, 61, 139],
      darkslategray: [47, 79, 79],
      darkslategrey: [47, 79, 79],
      darkturquoise: [0, 206, 209],
      darkviolet: [148, 0, 211],
      deeppink: [255, 20, 147],
      deepskyblue: [0, 191, 255],
      dimgray: [105, 105, 105],
      dimgrey: [105, 105, 105],
      dodgerblue: [30, 144, 255],
      firebrick: [178, 34, 34],
      floralwhite: [255, 250, 240],
      forestgreen: [34, 139, 34],
      fuchsia: [255, 0, 255],
      gainsboro: [220, 220, 220],
      ghostwhite: [248, 248, 255],
      gold: [255, 215, 0],
      goldenrod: [218, 165, 32],
      gray: [128, 128, 128],
      green: [0, 128, 0],
      greenyellow: [173, 255, 47],
      grey: [128, 128, 128],
      honeydew: [240, 255, 240],
      hotpink: [255, 105, 180],
      indianred: [205, 92, 92],
      indigo: [75, 0, 130],
      ivory: [255, 255, 240],
      khaki: [240, 230, 140],
      lavender: [230, 230, 250],
      lavenderblush: [255, 240, 245],
      lawngreen: [124, 252, 0],
      lemonchiffon: [255, 250, 205],
      lightblue: [173, 216, 230],
      lightcoral: [240, 128, 128],
      lightcyan: [224, 255, 255],
      lightgoldenrodyellow: [250, 250, 210],
      lightgray: [211, 211, 211],
      lightgreen: [144, 238, 144],
      lightgrey: [211, 211, 211],
      lightpink: [255, 182, 193],
      lightsalmon: [255, 160, 122],
      lightseagreen: [32, 178, 170],
      lightskyblue: [135, 206, 250],
      lightslategray: [119, 136, 153],
      lightslategrey: [119, 136, 153],
      lightsteelblue: [176, 196, 222],
      lightyellow: [255, 255, 224],
      lime: [0, 255, 0],
      limegreen: [50, 205, 50],
      linen: [250, 240, 230],
      magenta: [255, 0, 255],
      maroon: [128, 0, 0],
      mediumaquamarine: [102, 205, 170],
      mediumblue: [0, 0, 205],
      mediumorchid: [186, 85, 211],
      mediumpurple: [147, 112, 219],
      mediumseagreen: [60, 179, 113],
      mediumslateblue: [123, 104, 238],
      mediumspringgreen: [0, 250, 154],
      mediumturquoise: [72, 209, 204],
      mediumvioletred: [199, 21, 133],
      midnightblue: [25, 25, 112],
      mintcream: [245, 255, 250],
      mistyrose: [255, 228, 225],
      moccasin: [255, 228, 181],
      navajowhite: [255, 222, 173],
      navy: [0, 0, 128],
      oldlace: [253, 245, 230],
      olive: [128, 128, 0],
      olivedrab: [107, 142, 35],
      orange: [255, 165, 0],
      orangered: [255, 69, 0],
      orchid: [218, 112, 214],
      palegoldenrod: [238, 232, 170],
      palegreen: [152, 251, 152],
      paleturquoise: [175, 238, 238],
      palevioletred: [219, 112, 147],
      papayawhip: [255, 239, 213],
      peachpuff: [255, 218, 185],
      peru: [205, 133, 63],
      pink: [255, 192, 203],
      plum: [221, 160, 221],
      powderblue: [176, 224, 230],
      purple: [128, 0, 128],
      rebeccapurple: [102, 51, 153],
      red: [255, 0, 0],
      rosybrown: [188, 143, 143],
      royalblue: [65, 105, 225],
      saddlebrown: [139, 69, 19],
      salmon: [250, 128, 114],
      sandybrown: [244, 164, 96],
      seagreen: [46, 139, 87],
      seashell: [255, 245, 238],
      sienna: [160, 82, 45],
      silver: [192, 192, 192],
      skyblue: [135, 206, 235],
      slateblue: [106, 90, 205],
      slategray: [112, 128, 144],
      slategrey: [112, 128, 144],
      snow: [255, 250, 250],
      springgreen: [0, 255, 127],
      steelblue: [70, 130, 180],
      tan: [210, 180, 140],
      teal: [0, 128, 128],
      thistle: [216, 191, 216],
      tomato: [255, 99, 71],
      turquoise: [64, 224, 208],
      violet: [238, 130, 238],
      wheat: [245, 222, 179],
      white: [255, 255, 255],
      whitesmoke: [245, 245, 245],
      yellow: [255, 255, 0],
      yellowgreen: [154, 205, 50]
    };
    var reverseNames = /* @__PURE__ */ Object.create(null);
    for (const name in color_name_default) {
      if (Object.hasOwn(color_name_default, name)) {
        reverseNames[color_name_default[name]] = name;
      }
    }
    var cs = {
      to: {},
      get: {}
    };
    cs.get = function(string) {
      const prefix = string.slice(0, 3).toLowerCase();
      let value;
      let model;
      switch (prefix) {
        case "hsl": {
          value = cs.get.hsl(string);
          model = "hsl";
          break;
        }
        case "hwb": {
          value = cs.get.hwb(string);
          model = "hwb";
          break;
        }
        default: {
          value = cs.get.rgb(string);
          model = "rgb";
          break;
        }
      }
      if (!value) {
        return null;
      }
      return { model, value };
    };
    cs.get.rgb = function(string) {
      if (!string) {
        return null;
      }
      const abbr = /^#([a-f\d]{3,4})$/i;
      const hex = /^#([a-f\d]{6})([a-f\d]{2})?$/i;
      const rgba = /^rgba?\(\s*([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)\s*(?:[\s,|/]\s*([+-]?[\d.]+)(%?)\s*)?\)$/;
      const per = /^rgba?\(\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*(?:[\s,|/]\s*([+-]?[\d.]+)(%?)\s*)?\)$/;
      const keyword = /^(\w+)$/;
      let rgb = [0, 0, 0, 1];
      let match;
      let i;
      let hexAlpha;
      if (match = string.match(hex)) {
        hexAlpha = match[2];
        match = match[1];
        for (i = 0; i < 3; i++) {
          const i2 = i * 2;
          rgb[i] = Number.parseInt(match.slice(i2, i2 + 2), 16);
        }
        if (hexAlpha) {
          rgb[3] = Number.parseInt(hexAlpha, 16) / 255;
        }
      } else if (match = string.match(abbr)) {
        match = match[1];
        hexAlpha = match[3];
        for (i = 0; i < 3; i++) {
          rgb[i] = Number.parseInt(match[i] + match[i], 16);
        }
        if (hexAlpha) {
          rgb[3] = Number.parseInt(hexAlpha + hexAlpha, 16) / 255;
        }
      } else if (match = string.match(rgba)) {
        for (i = 0; i < 3; i++) {
          rgb[i] = Number.parseInt(match[i + 1], 10);
        }
        if (match[4]) {
          rgb[3] = match[5] ? Number.parseFloat(match[4]) * 0.01 : Number.parseFloat(match[4]);
        }
      } else if (match = string.match(per)) {
        for (i = 0; i < 3; i++) {
          rgb[i] = Math.round(Number.parseFloat(match[i + 1]) * 2.55);
        }
        if (match[4]) {
          rgb[3] = match[5] ? Number.parseFloat(match[4]) * 0.01 : Number.parseFloat(match[4]);
        }
      } else if (match = string.match(keyword)) {
        if (match[1] === "transparent") {
          return [0, 0, 0, 0];
        }
        if (!Object.hasOwn(color_name_default, match[1])) {
          return null;
        }
        rgb = color_name_default[match[1]];
        rgb[3] = 1;
        return rgb;
      } else {
        return null;
      }
      for (i = 0; i < 3; i++) {
        rgb[i] = clamp(rgb[i], 0, 255);
      }
      rgb[3] = clamp(rgb[3], 0, 1);
      return rgb;
    };
    cs.get.hsl = function(string) {
      if (!string) {
        return null;
      }
      const hsl = /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*(?:[,|/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/;
      const match = string.match(hsl);
      if (match) {
        const alpha = Number.parseFloat(match[4]);
        const h = (Number.parseFloat(match[1]) % 360 + 360) % 360;
        const s = clamp(Number.parseFloat(match[2]), 0, 100);
        const l = clamp(Number.parseFloat(match[3]), 0, 100);
        const a = clamp(Number.isNaN(alpha) ? 1 : alpha, 0, 1);
        return [h, s, l, a];
      }
      return null;
    };
    cs.get.hwb = function(string) {
      if (!string) {
        return null;
      }
      const hwb = /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*[\s,]\s*([+-]?[\d.]+)%\s*[\s,]\s*([+-]?[\d.]+)%\s*(?:[\s,]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/;
      const match = string.match(hwb);
      if (match) {
        const alpha = Number.parseFloat(match[4]);
        const h = (Number.parseFloat(match[1]) % 360 + 360) % 360;
        const w = clamp(Number.parseFloat(match[2]), 0, 100);
        const b = clamp(Number.parseFloat(match[3]), 0, 100);
        const a = clamp(Number.isNaN(alpha) ? 1 : alpha, 0, 1);
        return [h, w, b, a];
      }
      return null;
    };
    cs.to.hex = function(...rgba) {
      return "#" + hexDouble(rgba[0]) + hexDouble(rgba[1]) + hexDouble(rgba[2]) + (rgba[3] < 1 ? hexDouble(Math.round(rgba[3] * 255)) : "");
    };
    cs.to.rgb = function(...rgba) {
      return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ")" : "rgba(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ", " + rgba[3] + ")";
    };
    cs.to.rgb.percent = function(...rgba) {
      const r = Math.round(rgba[0] / 255 * 100);
      const g = Math.round(rgba[1] / 255 * 100);
      const b = Math.round(rgba[2] / 255 * 100);
      return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + r + "%, " + g + "%, " + b + "%)" : "rgba(" + r + "%, " + g + "%, " + b + "%, " + rgba[3] + ")";
    };
    cs.to.hsl = function(...hsla) {
      return hsla.length < 4 || hsla[3] === 1 ? "hsl(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%)" : "hsla(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%, " + hsla[3] + ")";
    };
    cs.to.hwb = function(...hwba) {
      let a = "";
      if (hwba.length >= 4 && hwba[3] !== 1) {
        a = ", " + hwba[3];
      }
      return "hwb(" + hwba[0] + ", " + hwba[1] + "%, " + hwba[2] + "%" + a + ")";
    };
    cs.to.keyword = function(...rgb) {
      return reverseNames[rgb.slice(0, 3)];
    };
    function clamp(number_, min, max) {
      return Math.min(Math.max(min, number_), max);
    }
    function hexDouble(number_) {
      const string_ = Math.round(number_).toString(16).toUpperCase();
      return string_.length < 2 ? "0" + string_ : string_;
    }
    var color_string_default = cs;
    var reverseKeywords = {};
    for (const key of Object.keys(color_name_default)) {
      reverseKeywords[color_name_default[key]] = key;
    }
    var convert = {
      rgb: { channels: 3, labels: "rgb" },
      hsl: { channels: 3, labels: "hsl" },
      hsv: { channels: 3, labels: "hsv" },
      hwb: { channels: 3, labels: "hwb" },
      cmyk: { channels: 4, labels: "cmyk" },
      xyz: { channels: 3, labels: "xyz" },
      lab: { channels: 3, labels: "lab" },
      oklab: { channels: 3, labels: ["okl", "oka", "okb"] },
      lch: { channels: 3, labels: "lch" },
      oklch: { channels: 3, labels: ["okl", "okc", "okh"] },
      hex: { channels: 1, labels: ["hex"] },
      keyword: { channels: 1, labels: ["keyword"] },
      ansi16: { channels: 1, labels: ["ansi16"] },
      ansi256: { channels: 1, labels: ["ansi256"] },
      hcg: { channels: 3, labels: ["h", "c", "g"] },
      apple: { channels: 3, labels: ["r16", "g16", "b16"] },
      gray: { channels: 1, labels: ["gray"] }
    };
    var conversions_default = convert;
    var LAB_FT = (6 / 29) ** 3;
    function srgbNonlinearTransform(c) {
      const cc = c > 31308e-7 ? 1.055 * c ** (1 / 2.4) - 0.055 : c * 12.92;
      return Math.min(Math.max(0, cc), 1);
    }
    function srgbNonlinearTransformInv(c) {
      return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
    }
    for (const model of Object.keys(convert)) {
      if (!("channels" in convert[model])) {
        throw new Error("missing channels property: " + model);
      }
      if (!("labels" in convert[model])) {
        throw new Error("missing channel labels property: " + model);
      }
      if (convert[model].labels.length !== convert[model].channels) {
        throw new Error("channel and label counts mismatch: " + model);
      }
      const { channels, labels } = convert[model];
      delete convert[model].channels;
      delete convert[model].labels;
      Object.defineProperty(convert[model], "channels", { value: channels });
      Object.defineProperty(convert[model], "labels", { value: labels });
    }
    convert.rgb.hsl = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const delta = max - min;
      let h;
      let s;
      switch (max) {
        case min: {
          h = 0;
          break;
        }
        case r: {
          h = (g - b) / delta;
          break;
        }
        case g: {
          h = 2 + (b - r) / delta;
          break;
        }
        case b: {
          h = 4 + (r - g) / delta;
          break;
        }
      }
      h = Math.min(h * 60, 360);
      if (h < 0) {
        h += 360;
      }
      const l = (min + max) / 2;
      if (max === min) {
        s = 0;
      } else if (l <= 0.5) {
        s = delta / (max + min);
      } else {
        s = delta / (2 - max - min);
      }
      return [h, s * 100, l * 100];
    };
    convert.rgb.hsv = function(rgb) {
      let rdif;
      let gdif;
      let bdif;
      let h;
      let s;
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const v = Math.max(r, g, b);
      const diff = v - Math.min(r, g, b);
      const diffc = function(c) {
        return (v - c) / 6 / diff + 1 / 2;
      };
      if (diff === 0) {
        h = 0;
        s = 0;
      } else {
        s = diff / v;
        rdif = diffc(r);
        gdif = diffc(g);
        bdif = diffc(b);
        switch (v) {
          case r: {
            h = bdif - gdif;
            break;
          }
          case g: {
            h = 1 / 3 + rdif - bdif;
            break;
          }
          case b: {
            h = 2 / 3 + gdif - rdif;
            break;
          }
        }
        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
      }
      return [
        h * 360,
        s * 100,
        v * 100
      ];
    };
    convert.rgb.hwb = function(rgb) {
      const r = rgb[0];
      const g = rgb[1];
      let b = rgb[2];
      const h = convert.rgb.hsl(rgb)[0];
      const w = 1 / 255 * Math.min(r, Math.min(g, b));
      b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
      return [h, w * 100, b * 100];
    };
    convert.rgb.oklab = function(rgb) {
      const r = srgbNonlinearTransformInv(rgb[0] / 255);
      const g = srgbNonlinearTransformInv(rgb[1] / 255);
      const b = srgbNonlinearTransformInv(rgb[2] / 255);
      const lp = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
      const mp = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
      const sp = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
      const l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
      const aa = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
      const bb = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
      return [l * 100, aa * 100, bb * 100];
    };
    convert.rgb.cmyk = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const k = Math.min(1 - r, 1 - g, 1 - b);
      const c = (1 - r - k) / (1 - k) || 0;
      const m = (1 - g - k) / (1 - k) || 0;
      const y = (1 - b - k) / (1 - k) || 0;
      return [c * 100, m * 100, y * 100, k * 100];
    };
    function comparativeDistance(x, y) {
      return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
    }
    convert.rgb.keyword = function(rgb) {
      const reversed = reverseKeywords[rgb];
      if (reversed) {
        return reversed;
      }
      let currentClosestDistance = Number.POSITIVE_INFINITY;
      let currentClosestKeyword;
      for (const keyword of Object.keys(color_name_default)) {
        const value = color_name_default[keyword];
        const distance = comparativeDistance(rgb, value);
        if (distance < currentClosestDistance) {
          currentClosestDistance = distance;
          currentClosestKeyword = keyword;
        }
      }
      return currentClosestKeyword;
    };
    convert.keyword.rgb = function(keyword) {
      return color_name_default[keyword];
    };
    convert.rgb.xyz = function(rgb) {
      const r = srgbNonlinearTransformInv(rgb[0] / 255);
      const g = srgbNonlinearTransformInv(rgb[1] / 255);
      const b = srgbNonlinearTransformInv(rgb[2] / 255);
      const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
      const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
      const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;
      return [x * 100, y * 100, z * 100];
    };
    convert.rgb.lab = function(rgb) {
      const xyz = convert.rgb.xyz(rgb);
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > LAB_FT ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > LAB_FT ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > LAB_FT ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert.hsl.rgb = function(hsl) {
      const h = hsl[0] / 360;
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      let t3;
      let value;
      if (s === 0) {
        value = l * 255;
        return [value, value, value];
      }
      const t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const t1 = 2 * l - t2;
      const rgb = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * -(i - 1);
        if (t3 < 0) {
          t3++;
        }
        if (t3 > 1) {
          t3--;
        }
        if (6 * t3 < 1) {
          value = t1 + (t2 - t1) * 6 * t3;
        } else if (2 * t3 < 1) {
          value = t2;
        } else if (3 * t3 < 2) {
          value = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        } else {
          value = t1;
        }
        rgb[i] = value * 255;
      }
      return rgb;
    };
    convert.hsl.hsv = function(hsl) {
      const h = hsl[0];
      let s = hsl[1] / 100;
      let l = hsl[2] / 100;
      let smin = s;
      const lmin = Math.max(l, 0.01);
      l *= 2;
      s *= l <= 1 ? l : 2 - l;
      smin *= lmin <= 1 ? lmin : 2 - lmin;
      const v = (l + s) / 2;
      const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
      return [h, sv * 100, v * 100];
    };
    convert.hsv.rgb = function(hsv) {
      const h = hsv[0] / 60;
      const s = hsv[1] / 100;
      let v = hsv[2] / 100;
      const hi = Math.floor(h) % 6;
      const f = h - Math.floor(h);
      const p = 255 * v * (1 - s);
      const q = 255 * v * (1 - s * f);
      const t = 255 * v * (1 - s * (1 - f));
      v *= 255;
      switch (hi) {
        case 0: {
          return [v, t, p];
        }
        case 1: {
          return [q, v, p];
        }
        case 2: {
          return [p, v, t];
        }
        case 3: {
          return [p, q, v];
        }
        case 4: {
          return [t, p, v];
        }
        case 5: {
          return [v, p, q];
        }
      }
    };
    convert.hsv.hsl = function(hsv) {
      const h = hsv[0];
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const vmin = Math.max(v, 0.01);
      let sl;
      let l;
      l = (2 - s) * v;
      const lmin = (2 - s) * vmin;
      sl = s * vmin;
      sl /= lmin <= 1 ? lmin : 2 - lmin;
      sl = sl || 0;
      l /= 2;
      return [h, sl * 100, l * 100];
    };
    convert.hwb.rgb = function(hwb) {
      const h = hwb[0] / 360;
      let wh = hwb[1] / 100;
      let bl = hwb[2] / 100;
      const ratio = wh + bl;
      let f;
      if (ratio > 1) {
        wh /= ratio;
        bl /= ratio;
      }
      const i = Math.floor(6 * h);
      const v = 1 - bl;
      f = 6 * h - i;
      if ((i & 1) !== 0) {
        f = 1 - f;
      }
      const n = wh + f * (v - wh);
      let r;
      let g;
      let b;
      switch (i) {
        default:
        case 6:
        case 0: {
          r = v;
          g = n;
          b = wh;
          break;
        }
        case 1: {
          r = n;
          g = v;
          b = wh;
          break;
        }
        case 2: {
          r = wh;
          g = v;
          b = n;
          break;
        }
        case 3: {
          r = wh;
          g = n;
          b = v;
          break;
        }
        case 4: {
          r = n;
          g = wh;
          b = v;
          break;
        }
        case 5: {
          r = v;
          g = wh;
          b = n;
          break;
        }
      }
      return [r * 255, g * 255, b * 255];
    };
    convert.cmyk.rgb = function(cmyk) {
      const c = cmyk[0] / 100;
      const m = cmyk[1] / 100;
      const y = cmyk[2] / 100;
      const k = cmyk[3] / 100;
      const r = 1 - Math.min(1, c * (1 - k) + k);
      const g = 1 - Math.min(1, m * (1 - k) + k);
      const b = 1 - Math.min(1, y * (1 - k) + k);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.rgb = function(xyz) {
      const x = xyz[0] / 100;
      const y = xyz[1] / 100;
      const z = xyz[2] / 100;
      let r;
      let g;
      let b;
      r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
      g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
      b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
      r = srgbNonlinearTransform(r);
      g = srgbNonlinearTransform(g);
      b = srgbNonlinearTransform(b);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.lab = function(xyz) {
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > LAB_FT ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > LAB_FT ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > LAB_FT ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert.xyz.oklab = function(xyz) {
      const x = xyz[0] / 100;
      const y = xyz[1] / 100;
      const z = xyz[2] / 100;
      const lp = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
      const mp = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
      const sp = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);
      const l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
      const a = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
      const b = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
      return [l * 100, a * 100, b * 100];
    };
    convert.oklab.oklch = function(oklab) {
      return convert.lab.lch(oklab);
    };
    convert.oklab.xyz = function(oklab) {
      const ll = oklab[0] / 100;
      const a = oklab[1] / 100;
      const b = oklab[2] / 100;
      const l = (0.999999998 * ll + 0.396337792 * a + 0.215803758 * b) ** 3;
      const m = (1.000000008 * ll - 0.105561342 * a - 0.063854175 * b) ** 3;
      const s = (1.000000055 * ll - 0.089484182 * a - 1.291485538 * b) ** 3;
      const x = 1.227013851 * l - 0.55779998 * m + 0.281256149 * s;
      const y = -0.040580178 * l + 1.11225687 * m - 0.071676679 * s;
      const z = -0.076381285 * l - 0.421481978 * m + 1.58616322 * s;
      return [x * 100, y * 100, z * 100];
    };
    convert.oklab.rgb = function(oklab) {
      const ll = oklab[0] / 100;
      const aa = oklab[1] / 100;
      const bb = oklab[2] / 100;
      const l = (ll + 0.3963377774 * aa + 0.2158037573 * bb) ** 3;
      const m = (ll - 0.1055613458 * aa - 0.0638541728 * bb) ** 3;
      const s = (ll - 0.0894841775 * aa - 1.291485548 * bb) ** 3;
      const r = srgbNonlinearTransform(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
      const g = srgbNonlinearTransform(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
      const b = srgbNonlinearTransform(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
      return [r * 255, g * 255, b * 255];
    };
    convert.oklch.oklab = function(oklch) {
      return convert.lch.lab(oklch);
    };
    convert.lab.xyz = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let x;
      let y;
      let z;
      y = (l + 16) / 116;
      x = a / 500 + y;
      z = y - b / 200;
      const y2 = y ** 3;
      const x2 = x ** 3;
      const z2 = z ** 3;
      y = y2 > LAB_FT ? y2 : (y - 16 / 116) / 7.787;
      x = x2 > LAB_FT ? x2 : (x - 16 / 116) / 7.787;
      z = z2 > LAB_FT ? z2 : (z - 16 / 116) / 7.787;
      x *= 95.047;
      y *= 100;
      z *= 108.883;
      return [x, y, z];
    };
    convert.lab.lch = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let h;
      const hr = Math.atan2(b, a);
      h = hr * 360 / 2 / Math.PI;
      if (h < 0) {
        h += 360;
      }
      const c = Math.sqrt(a * a + b * b);
      return [l, c, h];
    };
    convert.lch.lab = function(lch) {
      const l = lch[0];
      const c = lch[1];
      const h = lch[2];
      const hr = h / 360 * 2 * Math.PI;
      const a = c * Math.cos(hr);
      const b = c * Math.sin(hr);
      return [l, a, b];
    };
    convert.rgb.ansi16 = function(args, saturation = null) {
      const [r, g, b] = args;
      let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation;
      value = Math.round(value / 50);
      if (value === 0) {
        return 30;
      }
      let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
      if (value === 2) {
        ansi += 60;
      }
      return ansi;
    };
    convert.hsv.ansi16 = function(args) {
      return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
    };
    convert.rgb.ansi256 = function(args) {
      const r = args[0];
      const g = args[1];
      const b = args[2];
      if (r >> 4 === g >> 4 && g >> 4 === b >> 4) {
        if (r < 8) {
          return 16;
        }
        if (r > 248) {
          return 231;
        }
        return Math.round((r - 8) / 247 * 24) + 232;
      }
      const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
      return ansi;
    };
    convert.ansi16.rgb = function(args) {
      args = args[0];
      let color = args % 10;
      if (color === 0 || color === 7) {
        if (args > 50) {
          color += 3.5;
        }
        color = color / 10.5 * 255;
        return [color, color, color];
      }
      const mult = (Math.trunc(args > 50) + 1) * 0.5;
      const r = (color & 1) * mult * 255;
      const g = (color >> 1 & 1) * mult * 255;
      const b = (color >> 2 & 1) * mult * 255;
      return [r, g, b];
    };
    convert.ansi256.rgb = function(args) {
      args = args[0];
      if (args >= 232) {
        const c = (args - 232) * 10 + 8;
        return [c, c, c];
      }
      args -= 16;
      let rem;
      const r = Math.floor(args / 36) / 5 * 255;
      const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
      const b = rem % 6 / 5 * 255;
      return [r, g, b];
    };
    convert.rgb.hex = function(args) {
      const integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
      const string = integer.toString(16).toUpperCase();
      return "000000".slice(string.length) + string;
    };
    convert.hex.rgb = function(args) {
      const match = args.toString(16).match(/[a-f\d]{6}|[a-f\d]{3}/i);
      if (!match) {
        return [0, 0, 0];
      }
      let colorString = match[0];
      if (match[0].length === 3) {
        colorString = [...colorString].map((char) => char + char).join("");
      }
      const integer = Number.parseInt(colorString, 16);
      const r = integer >> 16 & 255;
      const g = integer >> 8 & 255;
      const b = integer & 255;
      return [r, g, b];
    };
    convert.rgb.hcg = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const max = Math.max(Math.max(r, g), b);
      const min = Math.min(Math.min(r, g), b);
      const chroma = max - min;
      let hue;
      const grayscale = chroma < 1 ? min / (1 - chroma) : 0;
      if (chroma <= 0) {
        hue = 0;
      } else if (max === r) {
        hue = (g - b) / chroma % 6;
      } else if (max === g) {
        hue = 2 + (b - r) / chroma;
      } else {
        hue = 4 + (r - g) / chroma;
      }
      hue /= 6;
      hue %= 1;
      return [hue * 360, chroma * 100, grayscale * 100];
    };
    convert.hsl.hcg = function(hsl) {
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l);
      let f = 0;
      if (c < 1) {
        f = (l - 0.5 * c) / (1 - c);
      }
      return [hsl[0], c * 100, f * 100];
    };
    convert.hsv.hcg = function(hsv) {
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const c = s * v;
      let f = 0;
      if (c < 1) {
        f = (v - c) / (1 - c);
      }
      return [hsv[0], c * 100, f * 100];
    };
    convert.hcg.rgb = function(hcg) {
      const h = hcg[0] / 360;
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      if (c === 0) {
        return [g * 255, g * 255, g * 255];
      }
      const pure = [0, 0, 0];
      const hi = h % 1 * 6;
      const v = hi % 1;
      const w = 1 - v;
      let mg = 0;
      switch (Math.floor(hi)) {
        case 0: {
          pure[0] = 1;
          pure[1] = v;
          pure[2] = 0;
          break;
        }
        case 1: {
          pure[0] = w;
          pure[1] = 1;
          pure[2] = 0;
          break;
        }
        case 2: {
          pure[0] = 0;
          pure[1] = 1;
          pure[2] = v;
          break;
        }
        case 3: {
          pure[0] = 0;
          pure[1] = w;
          pure[2] = 1;
          break;
        }
        case 4: {
          pure[0] = v;
          pure[1] = 0;
          pure[2] = 1;
          break;
        }
        default: {
          pure[0] = 1;
          pure[1] = 0;
          pure[2] = w;
        }
      }
      mg = (1 - c) * g;
      return [
        (c * pure[0] + mg) * 255,
        (c * pure[1] + mg) * 255,
        (c * pure[2] + mg) * 255
      ];
    };
    convert.hcg.hsv = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      let f = 0;
      if (v > 0) {
        f = c / v;
      }
      return [hcg[0], f * 100, v * 100];
    };
    convert.hcg.hsl = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const l = g * (1 - c) + 0.5 * c;
      let s = 0;
      if (l > 0 && l < 0.5) {
        s = c / (2 * l);
      } else if (l >= 0.5 && l < 1) {
        s = c / (2 * (1 - l));
      }
      return [hcg[0], s * 100, l * 100];
    };
    convert.hcg.hwb = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      return [hcg[0], (v - c) * 100, (1 - v) * 100];
    };
    convert.hwb.hcg = function(hwb) {
      const w = hwb[1] / 100;
      const b = hwb[2] / 100;
      const v = 1 - b;
      const c = v - w;
      let g = 0;
      if (c < 1) {
        g = (v - c) / (1 - c);
      }
      return [hwb[0], c * 100, g * 100];
    };
    convert.apple.rgb = function(apple) {
      return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
    };
    convert.rgb.apple = function(rgb) {
      return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
    };
    convert.gray.rgb = function(args) {
      return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
    };
    convert.gray.hsl = function(args) {
      return [0, 0, args[0]];
    };
    convert.gray.hsv = convert.gray.hsl;
    convert.gray.hwb = function(gray) {
      return [0, 100, gray[0]];
    };
    convert.gray.cmyk = function(gray) {
      return [0, 0, 0, gray[0]];
    };
    convert.gray.lab = function(gray) {
      return [gray[0], 0, 0];
    };
    convert.gray.hex = function(gray) {
      const value = Math.round(gray[0] / 100 * 255) & 255;
      const integer = (value << 16) + (value << 8) + value;
      const string = integer.toString(16).toUpperCase();
      return "000000".slice(string.length) + string;
    };
    convert.rgb.gray = function(rgb) {
      const value = (rgb[0] + rgb[1] + rgb[2]) / 3;
      return [value / 255 * 100];
    };
    function buildGraph() {
      const graph = {};
      const models2 = Object.keys(conversions_default);
      for (let { length } = models2, i = 0; i < length; i++) {
        graph[models2[i]] = {
          // http://jsperf.com/1-vs-infinity
          // micro-opt, but this is simple.
          distance: -1,
          parent: null
        };
      }
      return graph;
    }
    function deriveBFS(fromModel) {
      const graph = buildGraph();
      const queue = [fromModel];
      graph[fromModel].distance = 0;
      while (queue.length > 0) {
        const current = queue.pop();
        const adjacents = Object.keys(conversions_default[current]);
        for (let { length } = adjacents, i = 0; i < length; i++) {
          const adjacent = adjacents[i];
          const node = graph[adjacent];
          if (node.distance === -1) {
            node.distance = graph[current].distance + 1;
            node.parent = current;
            queue.unshift(adjacent);
          }
        }
      }
      return graph;
    }
    function link(from, to) {
      return function(args) {
        return to(from(args));
      };
    }
    function wrapConversion(toModel, graph) {
      const path11 = [graph[toModel].parent, toModel];
      let fn = conversions_default[graph[toModel].parent][toModel];
      let cur = graph[toModel].parent;
      while (graph[cur].parent) {
        path11.unshift(graph[cur].parent);
        fn = link(conversions_default[graph[cur].parent][cur], fn);
        cur = graph[cur].parent;
      }
      fn.conversion = path11;
      return fn;
    }
    function route(fromModel) {
      const graph = deriveBFS(fromModel);
      const conversion = {};
      const models2 = Object.keys(graph);
      for (let { length } = models2, i = 0; i < length; i++) {
        const toModel = models2[i];
        const node = graph[toModel];
        if (node.parent === null) {
          continue;
        }
        conversion[toModel] = wrapConversion(toModel, graph);
      }
      return conversion;
    }
    var route_default = route;
    var convert2 = {};
    var models = Object.keys(conversions_default);
    function wrapRaw(fn) {
      const wrappedFn = function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        return fn(args);
      };
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    function wrapRounded(fn) {
      const wrappedFn = function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        const result = fn(args);
        if (typeof result === "object") {
          for (let { length } = result, i = 0; i < length; i++) {
            result[i] = Math.round(result[i]);
          }
        }
        return result;
      };
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    for (const fromModel of models) {
      convert2[fromModel] = {};
      Object.defineProperty(convert2[fromModel], "channels", { value: conversions_default[fromModel].channels });
      Object.defineProperty(convert2[fromModel], "labels", { value: conversions_default[fromModel].labels });
      const routes = route_default(fromModel);
      const routeModels = Object.keys(routes);
      for (const toModel of routeModels) {
        const fn = routes[toModel];
        convert2[fromModel][toModel] = wrapRounded(fn);
        convert2[fromModel][toModel].raw = wrapRaw(fn);
      }
    }
    var color_convert_default = convert2;
    var skippedModels = [
      // To be honest, I don't really feel like keyword belongs in color convert, but eh.
      "keyword",
      // Gray conflicts with some method names, and has its own method defined.
      "gray",
      // Shouldn't really be in color-convert either...
      "hex"
    ];
    var hashedModelKeys = {};
    for (const model of Object.keys(color_convert_default)) {
      hashedModelKeys[[...color_convert_default[model].labels].sort().join("")] = model;
    }
    var limiters = {};
    function Color(object, model) {
      if (!(this instanceof Color)) {
        return new Color(object, model);
      }
      if (model && model in skippedModels) {
        model = null;
      }
      if (model && !(model in color_convert_default)) {
        throw new Error("Unknown model: " + model);
      }
      let i;
      let channels;
      if (object == null) {
        this.model = "rgb";
        this.color = [0, 0, 0];
        this.valpha = 1;
      } else if (object instanceof Color) {
        this.model = object.model;
        this.color = [...object.color];
        this.valpha = object.valpha;
      } else if (typeof object === "string") {
        const result = color_string_default.get(object);
        if (result === null) {
          throw new Error("Unable to parse color from string: " + object);
        }
        this.model = result.model;
        channels = color_convert_default[this.model].channels;
        this.color = result.value.slice(0, channels);
        this.valpha = typeof result.value[channels] === "number" ? result.value[channels] : 1;
      } else if (object.length > 0) {
        this.model = model || "rgb";
        channels = color_convert_default[this.model].channels;
        const newArray = Array.prototype.slice.call(object, 0, channels);
        this.color = zeroArray(newArray, channels);
        this.valpha = typeof object[channels] === "number" ? object[channels] : 1;
      } else if (typeof object === "number") {
        this.model = "rgb";
        this.color = [
          object >> 16 & 255,
          object >> 8 & 255,
          object & 255
        ];
        this.valpha = 1;
      } else {
        this.valpha = 1;
        const keys = Object.keys(object);
        if ("alpha" in object) {
          keys.splice(keys.indexOf("alpha"), 1);
          this.valpha = typeof object.alpha === "number" ? object.alpha : 0;
        }
        const hashedKeys = keys.sort().join("");
        if (!(hashedKeys in hashedModelKeys)) {
          throw new Error("Unable to parse color from object: " + JSON.stringify(object));
        }
        this.model = hashedModelKeys[hashedKeys];
        const { labels } = color_convert_default[this.model];
        const color = [];
        for (i = 0; i < labels.length; i++) {
          color.push(object[labels[i]]);
        }
        this.color = zeroArray(color);
      }
      if (limiters[this.model]) {
        channels = color_convert_default[this.model].channels;
        for (i = 0; i < channels; i++) {
          const limit = limiters[this.model][i];
          if (limit) {
            this.color[i] = limit(this.color[i]);
          }
        }
      }
      this.valpha = Math.max(0, Math.min(1, this.valpha));
      if (Object.freeze) {
        Object.freeze(this);
      }
    }
    Color.prototype = {
      toString() {
        return this.string();
      },
      toJSON() {
        return this[this.model]();
      },
      string(places) {
        let self = this.model in color_string_default.to ? this : this.rgb();
        self = self.round(typeof places === "number" ? places : 1);
        const arguments_ = self.valpha === 1 ? self.color : [...self.color, this.valpha];
        return color_string_default.to[self.model](...arguments_);
      },
      percentString(places) {
        const self = this.rgb().round(typeof places === "number" ? places : 1);
        const arguments_ = self.valpha === 1 ? self.color : [...self.color, this.valpha];
        return color_string_default.to.rgb.percent(...arguments_);
      },
      array() {
        return this.valpha === 1 ? [...this.color] : [...this.color, this.valpha];
      },
      object() {
        const result = {};
        const { channels } = color_convert_default[this.model];
        const { labels } = color_convert_default[this.model];
        for (let i = 0; i < channels; i++) {
          result[labels[i]] = this.color[i];
        }
        if (this.valpha !== 1) {
          result.alpha = this.valpha;
        }
        return result;
      },
      unitArray() {
        const rgb = this.rgb().color;
        rgb[0] /= 255;
        rgb[1] /= 255;
        rgb[2] /= 255;
        if (this.valpha !== 1) {
          rgb.push(this.valpha);
        }
        return rgb;
      },
      unitObject() {
        const rgb = this.rgb().object();
        rgb.r /= 255;
        rgb.g /= 255;
        rgb.b /= 255;
        if (this.valpha !== 1) {
          rgb.alpha = this.valpha;
        }
        return rgb;
      },
      round(places) {
        places = Math.max(places || 0, 0);
        return new Color([...this.color.map(roundToPlace(places)), this.valpha], this.model);
      },
      alpha(value) {
        if (value !== void 0) {
          return new Color([...this.color, Math.max(0, Math.min(1, value))], this.model);
        }
        return this.valpha;
      },
      // Rgb
      red: getset("rgb", 0, maxfn(255)),
      green: getset("rgb", 1, maxfn(255)),
      blue: getset("rgb", 2, maxfn(255)),
      hue: getset(["hsl", "hsv", "hsl", "hwb", "hcg"], 0, (value) => (value % 360 + 360) % 360),
      saturationl: getset("hsl", 1, maxfn(100)),
      lightness: getset("hsl", 2, maxfn(100)),
      saturationv: getset("hsv", 1, maxfn(100)),
      value: getset("hsv", 2, maxfn(100)),
      chroma: getset("hcg", 1, maxfn(100)),
      gray: getset("hcg", 2, maxfn(100)),
      white: getset("hwb", 1, maxfn(100)),
      wblack: getset("hwb", 2, maxfn(100)),
      cyan: getset("cmyk", 0, maxfn(100)),
      magenta: getset("cmyk", 1, maxfn(100)),
      yellow: getset("cmyk", 2, maxfn(100)),
      black: getset("cmyk", 3, maxfn(100)),
      x: getset("xyz", 0, maxfn(95.047)),
      y: getset("xyz", 1, maxfn(100)),
      z: getset("xyz", 2, maxfn(108.833)),
      l: getset("lab", 0, maxfn(100)),
      a: getset("lab", 1),
      b: getset("lab", 2),
      keyword(value) {
        if (value !== void 0) {
          return new Color(value);
        }
        return color_convert_default[this.model].keyword(this.color);
      },
      hex(value) {
        if (value !== void 0) {
          return new Color(value);
        }
        return color_string_default.to.hex(...this.rgb().round().color);
      },
      hexa(value) {
        if (value !== void 0) {
          return new Color(value);
        }
        const rgbArray = this.rgb().round().color;
        let alphaHex = Math.round(this.valpha * 255).toString(16).toUpperCase();
        if (alphaHex.length === 1) {
          alphaHex = "0" + alphaHex;
        }
        return color_string_default.to.hex(...rgbArray) + alphaHex;
      },
      rgbNumber() {
        const rgb = this.rgb().color;
        return (rgb[0] & 255) << 16 | (rgb[1] & 255) << 8 | rgb[2] & 255;
      },
      luminosity() {
        const rgb = this.rgb().color;
        const lum = [];
        for (const [i, element] of rgb.entries()) {
          const chan = element / 255;
          lum[i] = chan <= 0.04045 ? chan / 12.92 : ((chan + 0.055) / 1.055) ** 2.4;
        }
        return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
      },
      contrast(color2) {
        const lum1 = this.luminosity();
        const lum2 = color2.luminosity();
        if (lum1 > lum2) {
          return (lum1 + 0.05) / (lum2 + 0.05);
        }
        return (lum2 + 0.05) / (lum1 + 0.05);
      },
      level(color2) {
        const contrastRatio = this.contrast(color2);
        if (contrastRatio >= 7) {
          return "AAA";
        }
        return contrastRatio >= 4.5 ? "AA" : "";
      },
      isDark() {
        const rgb = this.rgb().color;
        const yiq = (rgb[0] * 2126 + rgb[1] * 7152 + rgb[2] * 722) / 1e4;
        return yiq < 128;
      },
      isLight() {
        return !this.isDark();
      },
      negate() {
        const rgb = this.rgb();
        for (let i = 0; i < 3; i++) {
          rgb.color[i] = 255 - rgb.color[i];
        }
        return rgb;
      },
      lighten(ratio) {
        const hsl = this.hsl();
        hsl.color[2] += hsl.color[2] * ratio;
        return hsl;
      },
      darken(ratio) {
        const hsl = this.hsl();
        hsl.color[2] -= hsl.color[2] * ratio;
        return hsl;
      },
      saturate(ratio) {
        const hsl = this.hsl();
        hsl.color[1] += hsl.color[1] * ratio;
        return hsl;
      },
      desaturate(ratio) {
        const hsl = this.hsl();
        hsl.color[1] -= hsl.color[1] * ratio;
        return hsl;
      },
      whiten(ratio) {
        const hwb = this.hwb();
        hwb.color[1] += hwb.color[1] * ratio;
        return hwb;
      },
      blacken(ratio) {
        const hwb = this.hwb();
        hwb.color[2] += hwb.color[2] * ratio;
        return hwb;
      },
      grayscale() {
        const rgb = this.rgb().color;
        const value = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
        return Color.rgb(value, value, value);
      },
      fade(ratio) {
        return this.alpha(this.valpha - this.valpha * ratio);
      },
      opaquer(ratio) {
        return this.alpha(this.valpha + this.valpha * ratio);
      },
      rotate(degrees) {
        const hsl = this.hsl();
        let hue = hsl.color[0];
        hue = (hue + degrees) % 360;
        hue = hue < 0 ? 360 + hue : hue;
        hsl.color[0] = hue;
        return hsl;
      },
      mix(mixinColor, weight) {
        if (!mixinColor || !mixinColor.rgb) {
          throw new Error('Argument to "mix" was not a Color instance, but rather an instance of ' + typeof mixinColor);
        }
        const color1 = mixinColor.rgb();
        const color2 = this.rgb();
        const p = weight === void 0 ? 0.5 : weight;
        const w = 2 * p - 1;
        const a = color1.alpha() - color2.alpha();
        const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2;
        const w2 = 1 - w1;
        return Color.rgb(
          w1 * color1.red() + w2 * color2.red(),
          w1 * color1.green() + w2 * color2.green(),
          w1 * color1.blue() + w2 * color2.blue(),
          color1.alpha() * p + color2.alpha() * (1 - p)
        );
      }
    };
    for (const model of Object.keys(color_convert_default)) {
      if (skippedModels.includes(model)) {
        continue;
      }
      const { channels } = color_convert_default[model];
      Color.prototype[model] = function(...arguments_) {
        if (this.model === model) {
          return new Color(this);
        }
        if (arguments_.length > 0) {
          return new Color(arguments_, model);
        }
        return new Color([...assertArray(color_convert_default[this.model][model].raw(this.color)), this.valpha], model);
      };
      Color[model] = function(...arguments_) {
        let color = arguments_[0];
        if (typeof color === "number") {
          color = zeroArray(arguments_, channels);
        }
        return new Color(color, model);
      };
    }
    function roundTo(number, places) {
      return Number(number.toFixed(places));
    }
    function roundToPlace(places) {
      return function(number) {
        return roundTo(number, places);
      };
    }
    function getset(model, channel, modifier) {
      model = Array.isArray(model) ? model : [model];
      for (const m of model) {
        (limiters[m] ||= [])[channel] = modifier;
      }
      model = model[0];
      return function(value) {
        let result;
        if (value !== void 0) {
          if (modifier) {
            value = modifier(value);
          }
          result = this[model]();
          result.color[channel] = value;
          return result;
        }
        result = this[model]().color[channel];
        if (modifier) {
          result = modifier(result);
        }
        return result;
      };
    }
    function maxfn(max) {
      return function(v) {
        return Math.max(0, Math.min(max, v));
      };
    }
    function assertArray(value) {
      return Array.isArray(value) ? value : [value];
    }
    function zeroArray(array, length) {
      for (let i = 0; i < length; i++) {
        if (typeof array[i] !== "number") {
          array[i] = 0;
        }
      }
      return array;
    }
    var index_default = Color;
  }
});

// node_modules/@img/colour/index.cjs
var require_colour = __commonJS({
  "node_modules/@img/colour/index.cjs"(exports2, module2) {
    module2.exports = require_color().default;
  }
});

// node_modules/sharp/lib/colour.js
var require_colour2 = __commonJS({
  "node_modules/sharp/lib/colour.js"(exports2, module2) {
    var color = require_colour();
    var is = require_is();
    var colourspace = {
      multiband: "multiband",
      "b-w": "b-w",
      bw: "b-w",
      cmyk: "cmyk",
      srgb: "srgb"
    };
    function tint(tint2) {
      this._setBackgroundColourOption("tint", tint2);
      return this;
    }
    function greyscale(greyscale2) {
      this.options.greyscale = is.bool(greyscale2) ? greyscale2 : true;
      return this;
    }
    function grayscale(grayscale2) {
      return this.greyscale(grayscale2);
    }
    function pipelineColourspace(colourspace2) {
      if (!is.string(colourspace2)) {
        throw is.invalidParameterError("colourspace", "string", colourspace2);
      }
      this.options.colourspacePipeline = colourspace2;
      return this;
    }
    function pipelineColorspace(colorspace) {
      return this.pipelineColourspace(colorspace);
    }
    function toColourspace(colourspace2) {
      if (!is.string(colourspace2)) {
        throw is.invalidParameterError("colourspace", "string", colourspace2);
      }
      this.options.colourspace = colourspace2;
      return this;
    }
    function toColorspace(colorspace) {
      return this.toColourspace(colorspace);
    }
    function _getBackgroundColourOption(value) {
      if (is.object(value) || is.string(value) && value.length >= 3 && value.length <= 200) {
        const colour = color(value);
        return [
          colour.red(),
          colour.green(),
          colour.blue(),
          Math.round(colour.alpha() * 255)
        ];
      } else {
        throw is.invalidParameterError("background", "object or string", value);
      }
    }
    function _setBackgroundColourOption(key, value) {
      if (is.defined(value)) {
        this.options[key] = _getBackgroundColourOption(value);
      }
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        // Public
        tint,
        greyscale,
        grayscale,
        pipelineColourspace,
        pipelineColorspace,
        toColourspace,
        toColorspace,
        // Private
        _getBackgroundColourOption,
        _setBackgroundColourOption
      });
      Sharp.colourspace = colourspace;
      Sharp.colorspace = colourspace;
    };
  }
});

// node_modules/sharp/lib/channel.js
var require_channel = __commonJS({
  "node_modules/sharp/lib/channel.js"(exports2, module2) {
    var is = require_is();
    var bool = {
      and: "and",
      or: "or",
      eor: "eor"
    };
    function removeAlpha() {
      this.options.removeAlpha = true;
      return this;
    }
    function ensureAlpha(alpha) {
      if (is.defined(alpha)) {
        if (is.number(alpha) && is.inRange(alpha, 0, 1)) {
          this.options.ensureAlpha = alpha;
        } else {
          throw is.invalidParameterError("alpha", "number between 0 and 1", alpha);
        }
      } else {
        this.options.ensureAlpha = 1;
      }
      return this;
    }
    function extractChannel(channel) {
      const channelMap = { red: 0, green: 1, blue: 2, alpha: 3 };
      if (Object.keys(channelMap).includes(channel)) {
        channel = channelMap[channel];
      }
      if (is.integer(channel) && is.inRange(channel, 0, 4)) {
        this.options.extractChannel = channel;
      } else {
        throw is.invalidParameterError("channel", "integer or one of: red, green, blue, alpha", channel);
      }
      return this;
    }
    function joinChannel(images, options) {
      if (Array.isArray(images)) {
        images.forEach(function(image) {
          this.options.joinChannelIn.push(this._createInputDescriptor(image, options));
        }, this);
      } else {
        this.options.joinChannelIn.push(this._createInputDescriptor(images, options));
      }
      return this;
    }
    function bandbool(boolOp) {
      if (is.string(boolOp) && is.inArray(boolOp, ["and", "or", "eor"])) {
        this.options.bandBoolOp = boolOp;
      } else {
        throw is.invalidParameterError("boolOp", "one of: and, or, eor", boolOp);
      }
      return this;
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        // Public instance functions
        removeAlpha,
        ensureAlpha,
        extractChannel,
        joinChannel,
        bandbool
      });
      Sharp.bool = bool;
    };
  }
});

// node_modules/sharp/lib/output.js
var require_output2 = __commonJS({
  "node_modules/sharp/lib/output.js"(exports2, module2) {
    var path11 = require("node:path");
    var is = require_is();
    var sharp3 = require_sharp();
    var formats = /* @__PURE__ */ new Map([
      ["heic", "heif"],
      ["heif", "heif"],
      ["avif", "avif"],
      ["jpeg", "jpeg"],
      ["jpg", "jpeg"],
      ["jpe", "jpeg"],
      ["tile", "tile"],
      ["dz", "tile"],
      ["png", "png"],
      ["raw", "raw"],
      ["tiff", "tiff"],
      ["tif", "tiff"],
      ["webp", "webp"],
      ["gif", "gif"],
      ["jp2", "jp2"],
      ["jpx", "jp2"],
      ["j2k", "jp2"],
      ["j2c", "jp2"],
      ["jxl", "jxl"]
    ]);
    var jp2Regex = /\.(jp[2x]|j2[kc])$/i;
    var errJp2Save = () => new Error("JP2 output requires libvips with support for OpenJPEG");
    var bitdepthFromColourCount = (colours) => 1 << 31 - Math.clz32(Math.ceil(Math.log2(colours)));
    function toFile(fileOut, callback) {
      let err;
      if (!is.string(fileOut)) {
        err = new Error("Missing output file path");
      } else if (is.string(this.options.input.file) && path11.resolve(this.options.input.file) === path11.resolve(fileOut)) {
        err = new Error("Cannot use same file for input and output");
      } else if (jp2Regex.test(path11.extname(fileOut)) && !this.constructor.format.jp2k.output.file) {
        err = errJp2Save();
      }
      if (err) {
        if (is.fn(callback)) {
          callback(err);
        } else {
          return Promise.reject(err);
        }
      } else {
        this.options.fileOut = fileOut;
        const stack = Error();
        return this._pipeline(callback, stack);
      }
      return this;
    }
    function toBuffer(options, callback) {
      if (is.object(options)) {
        this._setBooleanOption("resolveWithObject", options.resolveWithObject);
      } else if (this.options.resolveWithObject) {
        this.options.resolveWithObject = false;
      }
      this.options.fileOut = "";
      const stack = Error();
      return this._pipeline(is.fn(options) ? options : callback, stack);
    }
    function keepExif() {
      this.options.keepMetadata |= 1;
      return this;
    }
    function withExif(exif) {
      if (is.object(exif)) {
        for (const [ifd, entries] of Object.entries(exif)) {
          if (is.object(entries)) {
            for (const [k, v] of Object.entries(entries)) {
              if (is.string(v)) {
                this.options.withExif[`exif-${ifd.toLowerCase()}-${k}`] = v;
              } else {
                throw is.invalidParameterError(`${ifd}.${k}`, "string", v);
              }
            }
          } else {
            throw is.invalidParameterError(ifd, "object", entries);
          }
        }
      } else {
        throw is.invalidParameterError("exif", "object", exif);
      }
      this.options.withExifMerge = false;
      return this.keepExif();
    }
    function withExifMerge(exif) {
      this.withExif(exif);
      this.options.withExifMerge = true;
      return this;
    }
    function keepIccProfile() {
      this.options.keepMetadata |= 8;
      return this;
    }
    function withIccProfile(icc, options) {
      if (is.string(icc)) {
        this.options.withIccProfile = icc;
      } else {
        throw is.invalidParameterError("icc", "string", icc);
      }
      this.keepIccProfile();
      if (is.object(options)) {
        if (is.defined(options.attach)) {
          if (is.bool(options.attach)) {
            if (!options.attach) {
              this.options.keepMetadata &= ~8;
            }
          } else {
            throw is.invalidParameterError("attach", "boolean", options.attach);
          }
        }
      }
      return this;
    }
    function keepXmp() {
      this.options.keepMetadata |= 2;
      return this;
    }
    function withXmp(xmp) {
      if (is.string(xmp) && xmp.length > 0) {
        this.options.withXmp = xmp;
        this.options.keepMetadata |= 2;
      } else {
        throw is.invalidParameterError("xmp", "non-empty string", xmp);
      }
      return this;
    }
    function keepMetadata() {
      this.options.keepMetadata = 31;
      return this;
    }
    function withMetadata(options) {
      this.keepMetadata();
      this.withIccProfile("srgb");
      if (is.object(options)) {
        if (is.defined(options.orientation)) {
          if (is.integer(options.orientation) && is.inRange(options.orientation, 1, 8)) {
            this.options.withMetadataOrientation = options.orientation;
          } else {
            throw is.invalidParameterError("orientation", "integer between 1 and 8", options.orientation);
          }
        }
        if (is.defined(options.density)) {
          if (is.number(options.density) && options.density > 0) {
            this.options.withMetadataDensity = options.density;
          } else {
            throw is.invalidParameterError("density", "positive number", options.density);
          }
        }
        if (is.defined(options.icc)) {
          this.withIccProfile(options.icc);
        }
        if (is.defined(options.exif)) {
          this.withExifMerge(options.exif);
        }
      }
      return this;
    }
    function toFormat(format, options) {
      const actualFormat = formats.get((is.object(format) && is.string(format.id) ? format.id : format).toLowerCase());
      if (!actualFormat) {
        throw is.invalidParameterError("format", `one of: ${[...formats.keys()].join(", ")}`, format);
      }
      return this[actualFormat](options);
    }
    function jpeg(options) {
      if (is.object(options)) {
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.jpegQuality = options.quality;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        }
        if (is.defined(options.progressive)) {
          this._setBooleanOption("jpegProgressive", options.progressive);
        }
        if (is.defined(options.chromaSubsampling)) {
          if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
            this.options.jpegChromaSubsampling = options.chromaSubsampling;
          } else {
            throw is.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
          }
        }
        const optimiseCoding = is.bool(options.optimizeCoding) ? options.optimizeCoding : options.optimiseCoding;
        if (is.defined(optimiseCoding)) {
          this._setBooleanOption("jpegOptimiseCoding", optimiseCoding);
        }
        if (is.defined(options.mozjpeg)) {
          if (is.bool(options.mozjpeg)) {
            if (options.mozjpeg) {
              this.options.jpegTrellisQuantisation = true;
              this.options.jpegOvershootDeringing = true;
              this.options.jpegOptimiseScans = true;
              this.options.jpegProgressive = true;
              this.options.jpegQuantisationTable = 3;
            }
          } else {
            throw is.invalidParameterError("mozjpeg", "boolean", options.mozjpeg);
          }
        }
        const trellisQuantisation = is.bool(options.trellisQuantization) ? options.trellisQuantization : options.trellisQuantisation;
        if (is.defined(trellisQuantisation)) {
          this._setBooleanOption("jpegTrellisQuantisation", trellisQuantisation);
        }
        if (is.defined(options.overshootDeringing)) {
          this._setBooleanOption("jpegOvershootDeringing", options.overshootDeringing);
        }
        const optimiseScans = is.bool(options.optimizeScans) ? options.optimizeScans : options.optimiseScans;
        if (is.defined(optimiseScans)) {
          this._setBooleanOption("jpegOptimiseScans", optimiseScans);
          if (optimiseScans) {
            this.options.jpegProgressive = true;
          }
        }
        const quantisationTable = is.number(options.quantizationTable) ? options.quantizationTable : options.quantisationTable;
        if (is.defined(quantisationTable)) {
          if (is.integer(quantisationTable) && is.inRange(quantisationTable, 0, 8)) {
            this.options.jpegQuantisationTable = quantisationTable;
          } else {
            throw is.invalidParameterError("quantisationTable", "integer between 0 and 8", quantisationTable);
          }
        }
      }
      return this._updateFormatOut("jpeg", options);
    }
    function png(options) {
      if (is.object(options)) {
        if (is.defined(options.progressive)) {
          this._setBooleanOption("pngProgressive", options.progressive);
        }
        if (is.defined(options.compressionLevel)) {
          if (is.integer(options.compressionLevel) && is.inRange(options.compressionLevel, 0, 9)) {
            this.options.pngCompressionLevel = options.compressionLevel;
          } else {
            throw is.invalidParameterError("compressionLevel", "integer between 0 and 9", options.compressionLevel);
          }
        }
        if (is.defined(options.adaptiveFiltering)) {
          this._setBooleanOption("pngAdaptiveFiltering", options.adaptiveFiltering);
        }
        const colours = options.colours || options.colors;
        if (is.defined(colours)) {
          if (is.integer(colours) && is.inRange(colours, 2, 256)) {
            this.options.pngBitdepth = bitdepthFromColourCount(colours);
          } else {
            throw is.invalidParameterError("colours", "integer between 2 and 256", colours);
          }
        }
        if (is.defined(options.palette)) {
          this._setBooleanOption("pngPalette", options.palette);
        } else if ([options.quality, options.effort, options.colours, options.colors, options.dither].some(is.defined)) {
          this._setBooleanOption("pngPalette", true);
        }
        if (this.options.pngPalette) {
          if (is.defined(options.quality)) {
            if (is.integer(options.quality) && is.inRange(options.quality, 0, 100)) {
              this.options.pngQuality = options.quality;
            } else {
              throw is.invalidParameterError("quality", "integer between 0 and 100", options.quality);
            }
          }
          if (is.defined(options.effort)) {
            if (is.integer(options.effort) && is.inRange(options.effort, 1, 10)) {
              this.options.pngEffort = options.effort;
            } else {
              throw is.invalidParameterError("effort", "integer between 1 and 10", options.effort);
            }
          }
          if (is.defined(options.dither)) {
            if (is.number(options.dither) && is.inRange(options.dither, 0, 1)) {
              this.options.pngDither = options.dither;
            } else {
              throw is.invalidParameterError("dither", "number between 0.0 and 1.0", options.dither);
            }
          }
        }
      }
      return this._updateFormatOut("png", options);
    }
    function webp(options) {
      if (is.object(options)) {
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.webpQuality = options.quality;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        }
        if (is.defined(options.alphaQuality)) {
          if (is.integer(options.alphaQuality) && is.inRange(options.alphaQuality, 0, 100)) {
            this.options.webpAlphaQuality = options.alphaQuality;
          } else {
            throw is.invalidParameterError("alphaQuality", "integer between 0 and 100", options.alphaQuality);
          }
        }
        if (is.defined(options.lossless)) {
          this._setBooleanOption("webpLossless", options.lossless);
        }
        if (is.defined(options.nearLossless)) {
          this._setBooleanOption("webpNearLossless", options.nearLossless);
        }
        if (is.defined(options.smartSubsample)) {
          this._setBooleanOption("webpSmartSubsample", options.smartSubsample);
        }
        if (is.defined(options.smartDeblock)) {
          this._setBooleanOption("webpSmartDeblock", options.smartDeblock);
        }
        if (is.defined(options.preset)) {
          if (is.string(options.preset) && is.inArray(options.preset, ["default", "photo", "picture", "drawing", "icon", "text"])) {
            this.options.webpPreset = options.preset;
          } else {
            throw is.invalidParameterError("preset", "one of: default, photo, picture, drawing, icon, text", options.preset);
          }
        }
        if (is.defined(options.effort)) {
          if (is.integer(options.effort) && is.inRange(options.effort, 0, 6)) {
            this.options.webpEffort = options.effort;
          } else {
            throw is.invalidParameterError("effort", "integer between 0 and 6", options.effort);
          }
        }
        if (is.defined(options.minSize)) {
          this._setBooleanOption("webpMinSize", options.minSize);
        }
        if (is.defined(options.mixed)) {
          this._setBooleanOption("webpMixed", options.mixed);
        }
      }
      trySetAnimationOptions(options, this.options);
      return this._updateFormatOut("webp", options);
    }
    function gif(options) {
      if (is.object(options)) {
        if (is.defined(options.reuse)) {
          this._setBooleanOption("gifReuse", options.reuse);
        }
        if (is.defined(options.progressive)) {
          this._setBooleanOption("gifProgressive", options.progressive);
        }
        const colours = options.colours || options.colors;
        if (is.defined(colours)) {
          if (is.integer(colours) && is.inRange(colours, 2, 256)) {
            this.options.gifBitdepth = bitdepthFromColourCount(colours);
          } else {
            throw is.invalidParameterError("colours", "integer between 2 and 256", colours);
          }
        }
        if (is.defined(options.effort)) {
          if (is.number(options.effort) && is.inRange(options.effort, 1, 10)) {
            this.options.gifEffort = options.effort;
          } else {
            throw is.invalidParameterError("effort", "integer between 1 and 10", options.effort);
          }
        }
        if (is.defined(options.dither)) {
          if (is.number(options.dither) && is.inRange(options.dither, 0, 1)) {
            this.options.gifDither = options.dither;
          } else {
            throw is.invalidParameterError("dither", "number between 0.0 and 1.0", options.dither);
          }
        }
        if (is.defined(options.interFrameMaxError)) {
          if (is.number(options.interFrameMaxError) && is.inRange(options.interFrameMaxError, 0, 32)) {
            this.options.gifInterFrameMaxError = options.interFrameMaxError;
          } else {
            throw is.invalidParameterError("interFrameMaxError", "number between 0.0 and 32.0", options.interFrameMaxError);
          }
        }
        if (is.defined(options.interPaletteMaxError)) {
          if (is.number(options.interPaletteMaxError) && is.inRange(options.interPaletteMaxError, 0, 256)) {
            this.options.gifInterPaletteMaxError = options.interPaletteMaxError;
          } else {
            throw is.invalidParameterError("interPaletteMaxError", "number between 0.0 and 256.0", options.interPaletteMaxError);
          }
        }
        if (is.defined(options.keepDuplicateFrames)) {
          if (is.bool(options.keepDuplicateFrames)) {
            this._setBooleanOption("gifKeepDuplicateFrames", options.keepDuplicateFrames);
          } else {
            throw is.invalidParameterError("keepDuplicateFrames", "boolean", options.keepDuplicateFrames);
          }
        }
      }
      trySetAnimationOptions(options, this.options);
      return this._updateFormatOut("gif", options);
    }
    function jp2(options) {
      if (!this.constructor.format.jp2k.output.buffer) {
        throw errJp2Save();
      }
      if (is.object(options)) {
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.jp2Quality = options.quality;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        }
        if (is.defined(options.lossless)) {
          if (is.bool(options.lossless)) {
            this.options.jp2Lossless = options.lossless;
          } else {
            throw is.invalidParameterError("lossless", "boolean", options.lossless);
          }
        }
        if (is.defined(options.tileWidth)) {
          if (is.integer(options.tileWidth) && is.inRange(options.tileWidth, 1, 32768)) {
            this.options.jp2TileWidth = options.tileWidth;
          } else {
            throw is.invalidParameterError("tileWidth", "integer between 1 and 32768", options.tileWidth);
          }
        }
        if (is.defined(options.tileHeight)) {
          if (is.integer(options.tileHeight) && is.inRange(options.tileHeight, 1, 32768)) {
            this.options.jp2TileHeight = options.tileHeight;
          } else {
            throw is.invalidParameterError("tileHeight", "integer between 1 and 32768", options.tileHeight);
          }
        }
        if (is.defined(options.chromaSubsampling)) {
          if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
            this.options.jp2ChromaSubsampling = options.chromaSubsampling;
          } else {
            throw is.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
          }
        }
      }
      return this._updateFormatOut("jp2", options);
    }
    function trySetAnimationOptions(source, target) {
      if (is.object(source) && is.defined(source.loop)) {
        if (is.integer(source.loop) && is.inRange(source.loop, 0, 65535)) {
          target.loop = source.loop;
        } else {
          throw is.invalidParameterError("loop", "integer between 0 and 65535", source.loop);
        }
      }
      if (is.object(source) && is.defined(source.delay)) {
        if (is.integer(source.delay) && is.inRange(source.delay, 0, 65535)) {
          target.delay = [source.delay];
        } else if (Array.isArray(source.delay) && source.delay.every(is.integer) && source.delay.every((v) => is.inRange(v, 0, 65535))) {
          target.delay = source.delay;
        } else {
          throw is.invalidParameterError("delay", "integer or an array of integers between 0 and 65535", source.delay);
        }
      }
    }
    function tiff(options) {
      if (is.object(options)) {
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.tiffQuality = options.quality;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        }
        if (is.defined(options.bitdepth)) {
          if (is.integer(options.bitdepth) && is.inArray(options.bitdepth, [1, 2, 4, 8])) {
            this.options.tiffBitdepth = options.bitdepth;
          } else {
            throw is.invalidParameterError("bitdepth", "1, 2, 4 or 8", options.bitdepth);
          }
        }
        if (is.defined(options.tile)) {
          this._setBooleanOption("tiffTile", options.tile);
        }
        if (is.defined(options.tileWidth)) {
          if (is.integer(options.tileWidth) && options.tileWidth > 0) {
            this.options.tiffTileWidth = options.tileWidth;
          } else {
            throw is.invalidParameterError("tileWidth", "integer greater than zero", options.tileWidth);
          }
        }
        if (is.defined(options.tileHeight)) {
          if (is.integer(options.tileHeight) && options.tileHeight > 0) {
            this.options.tiffTileHeight = options.tileHeight;
          } else {
            throw is.invalidParameterError("tileHeight", "integer greater than zero", options.tileHeight);
          }
        }
        if (is.defined(options.miniswhite)) {
          this._setBooleanOption("tiffMiniswhite", options.miniswhite);
        }
        if (is.defined(options.pyramid)) {
          this._setBooleanOption("tiffPyramid", options.pyramid);
        }
        if (is.defined(options.xres)) {
          if (is.number(options.xres) && options.xres > 0) {
            this.options.tiffXres = options.xres;
          } else {
            throw is.invalidParameterError("xres", "number greater than zero", options.xres);
          }
        }
        if (is.defined(options.yres)) {
          if (is.number(options.yres) && options.yres > 0) {
            this.options.tiffYres = options.yres;
          } else {
            throw is.invalidParameterError("yres", "number greater than zero", options.yres);
          }
        }
        if (is.defined(options.compression)) {
          if (is.string(options.compression) && is.inArray(options.compression, ["none", "jpeg", "deflate", "packbits", "ccittfax4", "lzw", "webp", "zstd", "jp2k"])) {
            this.options.tiffCompression = options.compression;
          } else {
            throw is.invalidParameterError("compression", "one of: none, jpeg, deflate, packbits, ccittfax4, lzw, webp, zstd, jp2k", options.compression);
          }
        }
        if (is.defined(options.bigtiff)) {
          this._setBooleanOption("tiffBigtiff", options.bigtiff);
        }
        if (is.defined(options.predictor)) {
          if (is.string(options.predictor) && is.inArray(options.predictor, ["none", "horizontal", "float"])) {
            this.options.tiffPredictor = options.predictor;
          } else {
            throw is.invalidParameterError("predictor", "one of: none, horizontal, float", options.predictor);
          }
        }
        if (is.defined(options.resolutionUnit)) {
          if (is.string(options.resolutionUnit) && is.inArray(options.resolutionUnit, ["inch", "cm"])) {
            this.options.tiffResolutionUnit = options.resolutionUnit;
          } else {
            throw is.invalidParameterError("resolutionUnit", "one of: inch, cm", options.resolutionUnit);
          }
        }
      }
      return this._updateFormatOut("tiff", options);
    }
    function avif(options) {
      return this.heif({ ...options, compression: "av1" });
    }
    function heif(options) {
      if (is.object(options)) {
        if (is.string(options.compression) && is.inArray(options.compression, ["av1", "hevc"])) {
          this.options.heifCompression = options.compression;
        } else {
          throw is.invalidParameterError("compression", "one of: av1, hevc", options.compression);
        }
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.heifQuality = options.quality;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        }
        if (is.defined(options.lossless)) {
          if (is.bool(options.lossless)) {
            this.options.heifLossless = options.lossless;
          } else {
            throw is.invalidParameterError("lossless", "boolean", options.lossless);
          }
        }
        if (is.defined(options.effort)) {
          if (is.integer(options.effort) && is.inRange(options.effort, 0, 9)) {
            this.options.heifEffort = options.effort;
          } else {
            throw is.invalidParameterError("effort", "integer between 0 and 9", options.effort);
          }
        }
        if (is.defined(options.chromaSubsampling)) {
          if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
            this.options.heifChromaSubsampling = options.chromaSubsampling;
          } else {
            throw is.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
          }
        }
        if (is.defined(options.bitdepth)) {
          if (is.integer(options.bitdepth) && is.inArray(options.bitdepth, [8, 10, 12])) {
            if (options.bitdepth !== 8 && this.constructor.versions.heif) {
              throw is.invalidParameterError("bitdepth when using prebuilt binaries", 8, options.bitdepth);
            }
            this.options.heifBitdepth = options.bitdepth;
          } else {
            throw is.invalidParameterError("bitdepth", "8, 10 or 12", options.bitdepth);
          }
        }
      } else {
        throw is.invalidParameterError("options", "Object", options);
      }
      return this._updateFormatOut("heif", options);
    }
    function jxl(options) {
      if (is.object(options)) {
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.jxlDistance = options.quality >= 30 ? 0.1 + (100 - options.quality) * 0.09 : 53 / 3e3 * options.quality * options.quality - 23 / 20 * options.quality + 25;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        } else if (is.defined(options.distance)) {
          if (is.number(options.distance) && is.inRange(options.distance, 0, 15)) {
            this.options.jxlDistance = options.distance;
          } else {
            throw is.invalidParameterError("distance", "number between 0.0 and 15.0", options.distance);
          }
        }
        if (is.defined(options.decodingTier)) {
          if (is.integer(options.decodingTier) && is.inRange(options.decodingTier, 0, 4)) {
            this.options.jxlDecodingTier = options.decodingTier;
          } else {
            throw is.invalidParameterError("decodingTier", "integer between 0 and 4", options.decodingTier);
          }
        }
        if (is.defined(options.lossless)) {
          if (is.bool(options.lossless)) {
            this.options.jxlLossless = options.lossless;
          } else {
            throw is.invalidParameterError("lossless", "boolean", options.lossless);
          }
        }
        if (is.defined(options.effort)) {
          if (is.integer(options.effort) && is.inRange(options.effort, 1, 9)) {
            this.options.jxlEffort = options.effort;
          } else {
            throw is.invalidParameterError("effort", "integer between 1 and 9", options.effort);
          }
        }
      }
      trySetAnimationOptions(options, this.options);
      return this._updateFormatOut("jxl", options);
    }
    function raw(options) {
      if (is.object(options)) {
        if (is.defined(options.depth)) {
          if (is.string(options.depth) && is.inArray(
            options.depth,
            ["char", "uchar", "short", "ushort", "int", "uint", "float", "complex", "double", "dpcomplex"]
          )) {
            this.options.rawDepth = options.depth;
          } else {
            throw is.invalidParameterError("depth", "one of: char, uchar, short, ushort, int, uint, float, complex, double, dpcomplex", options.depth);
          }
        }
      }
      return this._updateFormatOut("raw");
    }
    function tile(options) {
      if (is.object(options)) {
        if (is.defined(options.size)) {
          if (is.integer(options.size) && is.inRange(options.size, 1, 8192)) {
            this.options.tileSize = options.size;
          } else {
            throw is.invalidParameterError("size", "integer between 1 and 8192", options.size);
          }
        }
        if (is.defined(options.overlap)) {
          if (is.integer(options.overlap) && is.inRange(options.overlap, 0, 8192)) {
            if (options.overlap > this.options.tileSize) {
              throw is.invalidParameterError("overlap", `<= size (${this.options.tileSize})`, options.overlap);
            }
            this.options.tileOverlap = options.overlap;
          } else {
            throw is.invalidParameterError("overlap", "integer between 0 and 8192", options.overlap);
          }
        }
        if (is.defined(options.container)) {
          if (is.string(options.container) && is.inArray(options.container, ["fs", "zip"])) {
            this.options.tileContainer = options.container;
          } else {
            throw is.invalidParameterError("container", "one of: fs, zip", options.container);
          }
        }
        if (is.defined(options.layout)) {
          if (is.string(options.layout) && is.inArray(options.layout, ["dz", "google", "iiif", "iiif3", "zoomify"])) {
            this.options.tileLayout = options.layout;
          } else {
            throw is.invalidParameterError("layout", "one of: dz, google, iiif, iiif3, zoomify", options.layout);
          }
        }
        if (is.defined(options.angle)) {
          if (is.integer(options.angle) && !(options.angle % 90)) {
            this.options.tileAngle = options.angle;
          } else {
            throw is.invalidParameterError("angle", "positive/negative multiple of 90", options.angle);
          }
        }
        this._setBackgroundColourOption("tileBackground", options.background);
        if (is.defined(options.depth)) {
          if (is.string(options.depth) && is.inArray(options.depth, ["onepixel", "onetile", "one"])) {
            this.options.tileDepth = options.depth;
          } else {
            throw is.invalidParameterError("depth", "one of: onepixel, onetile, one", options.depth);
          }
        }
        if (is.defined(options.skipBlanks)) {
          if (is.integer(options.skipBlanks) && is.inRange(options.skipBlanks, -1, 65535)) {
            this.options.tileSkipBlanks = options.skipBlanks;
          } else {
            throw is.invalidParameterError("skipBlanks", "integer between -1 and 255/65535", options.skipBlanks);
          }
        } else if (is.defined(options.layout) && options.layout === "google") {
          this.options.tileSkipBlanks = 5;
        }
        const centre = is.bool(options.center) ? options.center : options.centre;
        if (is.defined(centre)) {
          this._setBooleanOption("tileCentre", centre);
        }
        if (is.defined(options.id)) {
          if (is.string(options.id)) {
            this.options.tileId = options.id;
          } else {
            throw is.invalidParameterError("id", "string", options.id);
          }
        }
        if (is.defined(options.basename)) {
          if (is.string(options.basename)) {
            this.options.tileBasename = options.basename;
          } else {
            throw is.invalidParameterError("basename", "string", options.basename);
          }
        }
      }
      if (is.inArray(this.options.formatOut, ["jpeg", "png", "webp"])) {
        this.options.tileFormat = this.options.formatOut;
      } else if (this.options.formatOut !== "input") {
        throw is.invalidParameterError("format", "one of: jpeg, png, webp", this.options.formatOut);
      }
      return this._updateFormatOut("dz");
    }
    function timeout(options) {
      if (!is.plainObject(options)) {
        throw is.invalidParameterError("options", "object", options);
      }
      if (is.integer(options.seconds) && is.inRange(options.seconds, 0, 3600)) {
        this.options.timeoutSeconds = options.seconds;
      } else {
        throw is.invalidParameterError("seconds", "integer between 0 and 3600", options.seconds);
      }
      return this;
    }
    function _updateFormatOut(formatOut, options) {
      if (!(is.object(options) && options.force === false)) {
        this.options.formatOut = formatOut;
      }
      return this;
    }
    function _setBooleanOption(key, val) {
      if (is.bool(val)) {
        this.options[key] = val;
      } else {
        throw is.invalidParameterError(key, "boolean", val);
      }
    }
    function _read() {
      if (!this.options.streamOut) {
        this.options.streamOut = true;
        const stack = Error();
        this._pipeline(void 0, stack);
      }
    }
    function _pipeline(callback, stack) {
      if (typeof callback === "function") {
        if (this._isStreamInput()) {
          this.on("finish", () => {
            this._flattenBufferIn();
            sharp3.pipeline(this.options, (err, data, info) => {
              if (err) {
                callback(is.nativeError(err, stack));
              } else {
                callback(null, data, info);
              }
            });
          });
        } else {
          sharp3.pipeline(this.options, (err, data, info) => {
            if (err) {
              callback(is.nativeError(err, stack));
            } else {
              callback(null, data, info);
            }
          });
        }
        return this;
      } else if (this.options.streamOut) {
        if (this._isStreamInput()) {
          this.once("finish", () => {
            this._flattenBufferIn();
            sharp3.pipeline(this.options, (err, data, info) => {
              if (err) {
                this.emit("error", is.nativeError(err, stack));
              } else {
                this.emit("info", info);
                this.push(data);
              }
              this.push(null);
              this.on("end", () => this.emit("close"));
            });
          });
          if (this.streamInFinished) {
            this.emit("finish");
          }
        } else {
          sharp3.pipeline(this.options, (err, data, info) => {
            if (err) {
              this.emit("error", is.nativeError(err, stack));
            } else {
              this.emit("info", info);
              this.push(data);
            }
            this.push(null);
            this.on("end", () => this.emit("close"));
          });
        }
        return this;
      } else {
        if (this._isStreamInput()) {
          return new Promise((resolve, reject) => {
            this.once("finish", () => {
              this._flattenBufferIn();
              sharp3.pipeline(this.options, (err, data, info) => {
                if (err) {
                  reject(is.nativeError(err, stack));
                } else {
                  if (this.options.resolveWithObject) {
                    resolve({ data, info });
                  } else {
                    resolve(data);
                  }
                }
              });
            });
          });
        } else {
          return new Promise((resolve, reject) => {
            sharp3.pipeline(this.options, (err, data, info) => {
              if (err) {
                reject(is.nativeError(err, stack));
              } else {
                if (this.options.resolveWithObject) {
                  resolve({ data, info });
                } else {
                  resolve(data);
                }
              }
            });
          });
        }
      }
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        // Public
        toFile,
        toBuffer,
        keepExif,
        withExif,
        withExifMerge,
        keepIccProfile,
        withIccProfile,
        keepXmp,
        withXmp,
        keepMetadata,
        withMetadata,
        toFormat,
        jpeg,
        jp2,
        png,
        webp,
        tiff,
        avif,
        heif,
        jxl,
        gif,
        raw,
        tile,
        timeout,
        // Private
        _updateFormatOut,
        _setBooleanOption,
        _read,
        _pipeline
      });
    };
  }
});

// node_modules/sharp/lib/utility.js
var require_utility = __commonJS({
  "node_modules/sharp/lib/utility.js"(exports2, module2) {
    var events = require("node:events");
    var detectLibc = require_detect_libc();
    var is = require_is();
    var { runtimePlatformArch } = require_libvips();
    var sharp3 = require_sharp();
    var runtimePlatform = runtimePlatformArch();
    var libvipsVersion = sharp3.libvipsVersion();
    var format = sharp3.format();
    format.heif.output.alias = ["avif", "heic"];
    format.jpeg.output.alias = ["jpe", "jpg"];
    format.tiff.output.alias = ["tif"];
    format.jp2k.output.alias = ["j2c", "j2k", "jp2", "jpx"];
    var interpolators = {
      /** [Nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation). Suitable for image enlargement only. */
      nearest: "nearest",
      /** [Bilinear interpolation](http://en.wikipedia.org/wiki/Bilinear_interpolation). Faster than bicubic but with less smooth results. */
      bilinear: "bilinear",
      /** [Bicubic interpolation](http://en.wikipedia.org/wiki/Bicubic_interpolation) (the default). */
      bicubic: "bicubic",
      /** [LBB interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/lbb.cpp#L100). Prevents some "[acutance](http://en.wikipedia.org/wiki/Acutance)" but typically reduces performance by a factor of 2. */
      locallyBoundedBicubic: "lbb",
      /** [Nohalo interpolation](http://eprints.soton.ac.uk/268086/). Prevents acutance but typically reduces performance by a factor of 3. */
      nohalo: "nohalo",
      /** [VSQBS interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/vsqbs.cpp#L48). Prevents "staircasing" when enlarging. */
      vertexSplitQuadraticBasisSpline: "vsqbs"
    };
    var versions = {
      vips: libvipsVersion.semver
    };
    if (!libvipsVersion.isGlobal) {
      if (!libvipsVersion.isWasm) {
        try {
          versions = require(`@img/sharp-${runtimePlatform}/versions`);
        } catch (_) {
          try {
            versions = require(`@img/sharp-libvips-${runtimePlatform}/versions`);
          } catch (_2) {
          }
        }
      } else {
        try {
          versions = require("@img/sharp-wasm32/versions");
        } catch (_) {
        }
      }
    }
    versions.sharp = require_package3().version;
    if (versions.heif && format.heif) {
      format.heif.input.fileSuffix = [".avif"];
      format.heif.output.alias = ["avif"];
    }
    function cache(options) {
      if (is.bool(options)) {
        if (options) {
          return sharp3.cache(50, 20, 100);
        } else {
          return sharp3.cache(0, 0, 0);
        }
      } else if (is.object(options)) {
        return sharp3.cache(options.memory, options.files, options.items);
      } else {
        return sharp3.cache();
      }
    }
    cache(true);
    function concurrency(concurrency2) {
      return sharp3.concurrency(is.integer(concurrency2) ? concurrency2 : null);
    }
    if (detectLibc.familySync() === detectLibc.GLIBC && !sharp3._isUsingJemalloc()) {
      sharp3.concurrency(1);
    } else if (detectLibc.familySync() === detectLibc.MUSL && sharp3.concurrency() === 1024) {
      sharp3.concurrency(require("node:os").availableParallelism());
    }
    var queue = new events.EventEmitter();
    function counters() {
      return sharp3.counters();
    }
    function simd(simd2) {
      return sharp3.simd(is.bool(simd2) ? simd2 : null);
    }
    function block(options) {
      if (is.object(options)) {
        if (Array.isArray(options.operation) && options.operation.every(is.string)) {
          sharp3.block(options.operation, true);
        } else {
          throw is.invalidParameterError("operation", "Array<string>", options.operation);
        }
      } else {
        throw is.invalidParameterError("options", "object", options);
      }
    }
    function unblock(options) {
      if (is.object(options)) {
        if (Array.isArray(options.operation) && options.operation.every(is.string)) {
          sharp3.block(options.operation, false);
        } else {
          throw is.invalidParameterError("operation", "Array<string>", options.operation);
        }
      } else {
        throw is.invalidParameterError("options", "object", options);
      }
    }
    module2.exports = (Sharp) => {
      Sharp.cache = cache;
      Sharp.concurrency = concurrency;
      Sharp.counters = counters;
      Sharp.simd = simd;
      Sharp.format = format;
      Sharp.interpolators = interpolators;
      Sharp.versions = versions;
      Sharp.queue = queue;
      Sharp.block = block;
      Sharp.unblock = unblock;
    };
  }
});

// node_modules/sharp/lib/index.js
var require_lib = __commonJS({
  "node_modules/sharp/lib/index.js"(exports2, module2) {
    var Sharp = require_constructor();
    require_input()(Sharp);
    require_resize()(Sharp);
    require_composite()(Sharp);
    require_operation()(Sharp);
    require_colour2()(Sharp);
    require_channel()(Sharp);
    require_output2()(Sharp);
    require_utility()(Sharp);
    module2.exports = Sharp;
  }
});

// src/main/index.ts
var import_electron11 = require("electron");
var import_fluent_ffmpeg3 = __toESM(require_fluent_ffmpeg2());

// src/main/utils/paths.ts
var import_electron = require("electron");
var import_path = __toESM(require("path"));
var import_ffmpeg = __toESM(require_ffmpeg());
var import_ffprobe = __toESM(require_ffprobe2());
function getFfmpegPath() {
  if (import_electron.app.isPackaged) {
    return import_path.default.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      "@ffmpeg-installer",
      "ffmpeg",
      process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
    );
  }
  return import_ffmpeg.path;
}
function getFfprobePath() {
  if (import_electron.app.isPackaged) {
    return import_path.default.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      "@ffprobe-installer",
      "ffprobe",
      process.platform === "win32" ? "ffprobe.exe" : "ffprobe"
    );
  }
  return import_ffprobe.path;
}
function getWorkerPath() {
  if (import_electron.app.isPackaged) {
    return import_path.default.join(process.resourcesPath, "app.asar.unpacked", "dist", "main", "videoWorker.js");
  }
  return import_path.default.join(__dirname, "videoWorker.js");
}

// src/main/db/databaseManager.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var import_path2 = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var DatabaseManager = class {
  constructor(dataDir) {
    if (!import_fs.default.existsSync(dataDir)) {
      import_fs.default.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = import_path2.default.join(dataDir, "media.db");
    this.db = new import_better_sqlite3.default(this.dbPath);
    this.initializeDatabase();
  }
  initializeDatabase() {
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");
    this.db.pragma("cache_size = 10000");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        filename TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        duration REAL,
        thumbnail TEXT,
        createdAt INTEGER NOT NULL,
        modifiedAt INTEGER NOT NULL
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        mediaId TEXT NOT NULL,
        name TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        PRIMARY KEY (mediaId, name),
        FOREIGN KEY (mediaId) REFERENCES media(id) ON DELETE CASCADE
      )
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tags_mediaId ON tags(mediaId)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)
    `);
  }
  addMedia(media) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO media (
        id, path, filename, type, size, width, height, duration, thumbnail, createdAt, modifiedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      media.id,
      media.path,
      media.filename,
      media.type,
      media.size,
      media.width,
      media.height,
      media.duration,
      media.thumbnail,
      media.createdAt,
      media.modifiedAt
    );
  }
  getAllMedia() {
    const stmt = this.db.prepare(`
      SELECT id, path, filename, type, size, width, height, duration, thumbnail, createdAt, modifiedAt
      FROM media
      ORDER BY createdAt DESC
    `);
    const mediaList = [];
    for (const row of stmt.iterate()) {
      mediaList.push({
        ...row,
        tags: this.getTags(row.id)
      });
    }
    return mediaList;
  }
  getMediaById(id) {
    const stmt = this.db.prepare(`
      SELECT id, path, filename, type, size, width, height, duration, thumbnail, createdAt, modifiedAt
      FROM media
      WHERE id = ?
    `);
    const row = stmt.get(id);
    if (!row) return void 0;
    return {
      ...row,
      tags: this.getTags(row.id)
    };
  }
  deleteMedia(id) {
    this.db.transaction(() => {
      this.db.prepare("DELETE FROM tags WHERE mediaId = ?").run(id);
      this.db.prepare("DELETE FROM media WHERE id = ?").run(id);
    })();
  }
  clearAllMedia() {
    this.db.transaction(() => {
      this.db.prepare("DELETE FROM tags").run();
      this.db.prepare("DELETE FROM media").run();
    })();
  }
  addTag(mediaId, tag) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO tags (mediaId, name, createdAt)
      VALUES (?, ?, ?)
    `);
    stmt.run(mediaId, tag, Date.now());
  }
  removeTag(mediaId, tag) {
    const stmt = this.db.prepare(`
      DELETE FROM tags WHERE mediaId = ? AND name = ?
    `);
    stmt.run(mediaId, tag);
  }
  getTags(mediaId) {
    const stmt = this.db.prepare(`
      SELECT name FROM tags WHERE mediaId = ? ORDER BY name
    `);
    const tags = [];
    for (const row of stmt.iterate(mediaId)) {
      tags.push(row.name);
    }
    return tags;
  }
  searchByTags(tags) {
    if (tags.length === 0) {
      return this.getAllMedia();
    }
    let query = `
      SELECT id, path, filename, type, size, width, height, duration, thumbnail, createdAt, modifiedAt
      FROM media
      WHERE id IN (
    `;
    const params = [];
    tags.forEach((tag, index) => {
      if (index > 0) {
        query += " INTERSECT ";
      }
      query += `
        SELECT mediaId FROM tags WHERE name = ?
      `;
      params.push(tag);
    });
    query += `
      ) ORDER BY createdAt DESC
    `;
    const stmt = this.db.prepare(query);
    const mediaList = [];
    for (const row of stmt.iterate(...params)) {
      mediaList.push({
        ...row,
        tags: this.getTags(row.id)
      });
    }
    return mediaList;
  }
  // 获取所有唯一标签
  getAllTags() {
    const stmt = this.db.prepare(`
      SELECT DISTINCT name FROM tags ORDER BY name
    `);
    const tags = [];
    for (const row of stmt.iterate()) {
      tags.push(row.name);
    }
    return tags;
  }
  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close();
    }
  }
};

// src/main/utils/config.ts
var import_fs2 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));
var CONFIG_FILE = "config.json";
function getConfig() {
  const configPath = import_path3.default.join(process.cwd(), CONFIG_FILE);
  try {
    if (import_fs2.default.existsSync(configPath)) {
      return JSON.parse(import_fs2.default.readFileSync(configPath, "utf-8"));
    }
  } catch (e) {
    console.error("\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25:", e);
  }
  return {};
}
function saveConfig(config) {
  const configPath = import_path3.default.join(process.cwd(), CONFIG_FILE);
  try {
    import_fs2.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error("\u4FDD\u5B58\u914D\u7F6E\u5931\u8D25:", e);
  }
}
function getDefaultDataDir() {
  const config = getConfig();
  if (config.dataDir && typeof config.dataDir === "string" && config.dataDir.length > 0) {
    return config.dataDir;
  }
  return process.cwd();
}

// src/main/windows/MainWindow.ts
var import_electron2 = require("electron");
var import_path4 = __toESM(require("path"));
var import_fs3 = __toESM(require("fs"));
var mainWindow = null;
async function createMainWindow(isDev) {
  if (mainWindow) {
    mainWindow.focus();
    return mainWindow;
  }
  const preloadFromMain = import_path4.default.resolve(__dirname, "preload.js");
  const preloadFromSibling = import_path4.default.resolve(__dirname, "../preload.js");
  const preloadPath = import_fs3.default.existsSync(preloadFromMain) ? preloadFromMain : preloadFromSibling;
  mainWindow = new import_electron2.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 600,
    center: true,
    frame: false,
    backgroundColor: "#202020",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: !isDev
    },
    show: isDev
  });
  if (isDev) {
    await mainWindow.loadURL("http://localhost:5173");
  } else {
    await mainWindow.loadFile(import_path4.default.join(__dirname, "../../renderer/index.html"));
  }
  if (!isDev) {
    mainWindow.once("ready-to-show", () => {
      mainWindow?.show();
    });
  }
  mainWindow.webContents.on("did-finish-load", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  return mainWindow;
}
function getMainWindow() {
  return mainWindow;
}

// src/main/ipc/media.ts
var import_electron3 = require("electron");

// src/main/utils/MediaScanner.ts
var import_fs6 = __toESM(require("fs"));
var import_path7 = __toESM(require("path"));

// src/main/utils/fileProcessor.ts
var import_fs5 = __toESM(require("fs"));
var import_path6 = __toESM(require("path"));
var import_crypto2 = __toESM(require("crypto"));
var import_fluent_ffmpeg2 = __toESM(require_fluent_ffmpeg2());
var import_sharp2 = __toESM(require_lib());

// src/main/thumbnail.ts
var import_sharp = __toESM(require_lib());
var import_path5 = __toESM(require("path"));
var import_fs4 = __toESM(require("fs"));
var import_crypto = __toESM(require("crypto"));
var import_fluent_ffmpeg = __toESM(require_fluent_ffmpeg2());
var import_ffmpeg2 = __toESM(require_ffmpeg());
var THUMBNAIL_DIR = import_path5.default.join(process.cwd(), "thumbnails");
var THUMBNAIL_SIZE = 200;
function ensureThumbnailDir() {
  if (!import_fs4.default.existsSync(THUMBNAIL_DIR)) {
    import_fs4.default.mkdirSync(THUMBNAIL_DIR, { recursive: true });
  }
}
function getThumbnailPath(filePath) {
  const hash = import_crypto.default.createHash("md5").update(filePath).digest("hex");
  return import_path5.default.join(THUMBNAIL_DIR, `${hash}.jpg`);
}
function hasValidThumbnail(filePath) {
  const thumbnailPath = getThumbnailPath(filePath);
  if (!import_fs4.default.existsSync(thumbnailPath)) return false;
  try {
    const originalStat = import_fs4.default.statSync(filePath);
    const thumbnailStat = import_fs4.default.statSync(thumbnailPath);
    return thumbnailStat.mtime >= originalStat.mtime;
  } catch {
    return false;
  }
}
async function generateImageThumbnail(filePath) {
  try {
    ensureThumbnailDir();
    const thumbnailPath = getThumbnailPath(filePath);
    if (hasValidThumbnail(filePath)) {
      return `file://${thumbnailPath.replace(/\\/g, "/")}`;
    }
    await (0, import_sharp.default)(filePath).resize(THUMBNAIL_SIZE, null, {
      withoutEnlargement: true,
      fit: "inside"
    }).jpeg({
      quality: 85,
      progressive: true
    }).toFile(thumbnailPath);
    return `file://${thumbnailPath.replace(/\\/g, "/")}`;
  } catch (error) {
    console.error("\u751F\u6210\u56FE\u7247\u7F29\u7565\u56FE\u5931\u8D25:", filePath, error);
    return null;
  }
}
async function generateVideoThumbnail(filePath) {
  try {
    ensureThumbnailDir();
    const thumbnailPath = getThumbnailPath(filePath);
    if (hasValidThumbnail(filePath)) {
      return `file://${thumbnailPath.replace(/\\/g, "/")}`;
    }
    import_fluent_ffmpeg.default.setFfmpegPath(import_ffmpeg2.path);
    await new Promise((resolve, reject) => {
      (0, import_fluent_ffmpeg.default)(filePath).screenshots({
        timestamps: ["00:00:01"],
        filename: import_path5.default.basename(thumbnailPath),
        folder: THUMBNAIL_DIR,
        size: `${THUMBNAIL_SIZE}x?`
      }).on("end", () => resolve()).on("error", (err) => reject(err));
    });
    return `file://${thumbnailPath.replace(/\\/g, "/")}`;
  } catch (error) {
    console.error("\u751F\u6210\u89C6\u9891\u7F29\u7565\u56FE\u5931\u8D25:", filePath, error);
    return null;
  }
}
function cleanupThumbnails(validFilePaths) {
  try {
    if (!import_fs4.default.existsSync(THUMBNAIL_DIR)) return;
    const validHashes = new Set(
      validFilePaths.map((p) => import_crypto.default.createHash("md5").update(p).digest("hex"))
    );
    const files = import_fs4.default.readdirSync(THUMBNAIL_DIR);
    for (const file of files) {
      const hash = import_path5.default.basename(file, ".jpg");
      if (!validHashes.has(hash)) {
        import_fs4.default.unlinkSync(import_path5.default.join(THUMBNAIL_DIR, file));
        console.log("\u6E05\u7406\u8FC7\u671F\u7F29\u7565\u56FE:", file);
      }
    }
  } catch (error) {
    console.error("\u6E05\u7406\u7F29\u7565\u56FE\u5931\u8D25:", error);
  }
}

// src/main/utils/fileProcessor.ts
var VIDEO_EXT = [".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm", ".m4v"];
var IMAGE_EXT = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
async function processFileExternal(filePath) {
  const ext = import_path6.default.extname(filePath).toLowerCase();
  let type = null;
  if (VIDEO_EXT.includes(ext)) type = "video";
  else if (IMAGE_EXT.includes(ext)) type = "image";
  if (!type) return null;
  let stats;
  try {
    stats = await import_fs5.default.promises.stat(filePath);
  } catch (error) {
    console.error(`\u83B7\u53D6\u6587\u4EF6\u4FE1\u606F\u5931\u8D25: ${filePath}`, error);
    return null;
  }
  let thumbnail;
  try {
    const thumbnailPromise = type === "image" ? generateImageThumbnail(filePath) : generateVideoThumbnail(filePath);
    thumbnail = await Promise.race([
      thumbnailPromise,
      new Promise((resolve) => setTimeout(() => resolve(void 0), 5e3))
    ]) || void 0;
  } catch (error) {
    console.error("\u751F\u6210\u7F29\u7565\u56FE\u5931\u8D25:", filePath, error);
  }
  let width;
  let height;
  let duration;
  if (type === "video") {
    try {
      const metadata = await new Promise((resolve, reject) => {
        (0, import_fluent_ffmpeg2.default)(filePath).ffprobe((err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
      const videoStream = metadata.streams.find((s) => s.codec_type === "video");
      if (videoStream) {
        width = videoStream.width;
        height = videoStream.height;
      }
      duration = metadata.format.duration;
    } catch (error) {
      console.error("\u83B7\u53D6\u89C6\u9891\u5143\u6570\u636E\u5931\u8D25:", filePath, error);
    }
  } else if (type === "image") {
    try {
      const metadata = await (0, import_sharp2.default)(filePath).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch (error) {
      console.error("\u83B7\u53D6\u56FE\u7247\u5143\u6570\u636E\u5931\u8D25:", filePath, error);
    }
  }
  return {
    id: import_crypto2.default.createHash("md5").update(filePath).digest("hex"),
    path: filePath,
    filename: import_path6.default.basename(filePath),
    type,
    size: stats.size,
    width,
    height,
    duration,
    thumbnail,
    createdAt: Math.floor(stats.birthtimeMs / 1e3),
    modifiedAt: Math.floor(stats.mtimeMs / 1e3),
    tags: []
  };
}

// src/main/utils/MediaScanner.ts
var MediaScanner = class {
  constructor(onProgress) {
    this.onProgress = onProgress;
  }
  async scan(folderPaths) {
    const filePaths = [];
    for (const folderPath of folderPaths) {
      await this.collectFiles(folderPath, filePaths);
    }
    const results = [];
    const batchSize = 50;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((filePath) => this.processFile(filePath)));
      results.push(...batchResults.filter((m) => m !== null));
      const currentFile = filePaths[i];
      if (this.onProgress && currentFile) {
        this.onProgress({
          scanned: Math.min(i + batchSize, filePaths.length),
          total: filePaths.length,
          currentFolder: import_path7.default.dirname(currentFile)
        });
      }
      await new Promise((resolve) => setImmediate(resolve));
    }
    return results;
  }
  async collectFiles(dirPath, results) {
    try {
      const entries = await import_fs6.default.promises.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = import_path7.default.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await this.collectFiles(fullPath, results);
        } else if (entry.isFile()) {
          const ext = import_path7.default.extname(fullPath).toLowerCase();
          if (VIDEO_EXT.includes(ext) || IMAGE_EXT.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`\u8BFB\u53D6\u76EE\u5F55\u5931\u8D25: ${dirPath}`, error);
    }
  }
  async processFile(filePath) {
    return processFileExternal(filePath);
  }
};

// src/main/utils/validation.ts
var import_path8 = __toESM(require("path"));
var import_fs7 = __toESM(require("fs"));
function validateMediaId(id) {
  return typeof id === "string" && id.length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
}
function isValidFilePath(filePath) {
  if (typeof filePath !== "string") {
    return false;
  }
  try {
    const stats = import_fs7.default.statSync(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}
function isValidDirectoryPath(dirPath) {
  if (typeof dirPath !== "string") {
    return false;
  }
  try {
    const stats = import_fs7.default.statSync(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
function validateTimestamp(time) {
  return typeof time === "number" && time >= 0 && time <= 3600;
}
function validateTrimParams(params) {
  if (params.mode !== "keep" && params.mode !== "remove") {
    return { valid: false, error: "\u65E0\u6548\u7684\u526A\u8F91\u6A21\u5F0F" };
  }
  if (!isValidFilePath(params.input)) {
    return { valid: false, error: "\u8F93\u5165\u6587\u4EF6\u4E0D\u5B58\u5728\u6216\u4E0D\u53EF\u8BBF\u95EE" };
  }
  const outputDir = import_path8.default.dirname(params.output);
  if (!isValidDirectoryPath(outputDir)) {
    return { valid: false, error: "\u8F93\u51FA\u76EE\u5F55\u4E0D\u5B58\u5728\u6216\u4E0D\u53EF\u8BBF\u95EE" };
  }
  if (!validateTimestamp(params.start) || !validateTimestamp(params.end)) {
    return { valid: false, error: "\u65E0\u6548\u7684\u65F6\u95F4\u6233" };
  }
  if (params.start >= params.end) {
    return { valid: false, error: "\u5F00\u59CB\u65F6\u95F4\u5FC5\u987B\u5C0F\u4E8E\u7ED3\u675F\u65F6\u95F4" };
  }
  return { valid: true };
}

// src/main/ipc/media.ts
var import_fs8 = __toESM(require("fs"));
var import_path9 = __toESM(require("path"));
function registerMediaHandlers(dbManager) {
  import_electron3.ipcMain.handle("add-media-files", async (event) => {
    try {
      const window = import_electron3.BrowserWindow.fromWebContents(event.sender);
      if (!window) return null;
      const result = await import_electron3.dialog.showOpenDialog(window, {
        properties: ["openFile", "multiSelections"],
        title: "\u9009\u62E9\u5A92\u4F53\u6587\u4EF6",
        filters: [
          {
            name: "\u5A92\u4F53\u6587\u4EF6",
            extensions: [
              "mp4",
              "avi",
              "mkv",
              "mov",
              "wmv",
              "flv",
              "webm",
              "m4v",
              "jpg",
              "jpeg",
              "png",
              "gif",
              "bmp",
              "webp"
            ]
          },
          { name: "\u6240\u6709\u6587\u4EF6", extensions: ["*"] }
        ]
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      const files = [];
      for (const filePath of result.filePaths) {
        const media = await processFileExternal(filePath);
        if (media) {
          dbManager.addMedia(media);
          files.push(media);
        }
      }
      return files;
    } catch (error) {
      console.error("\u6DFB\u52A0\u6587\u4EF6\u5931\u8D25:", error);
      throw error;
    }
  });
  import_electron3.ipcMain.handle("add-media-folder", async (event) => {
    try {
      const window = import_electron3.BrowserWindow.fromWebContents(event.sender);
      if (!window) return null;
      const result = await import_electron3.dialog.showOpenDialog(window, {
        properties: ["openDirectory", "multiSelections"],
        title: "\u9009\u62E9\u5A92\u4F53\u6587\u4EF6\u5939\uFF08\u53EF\u591A\u9009\uFF09"
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      event.sender.send("scan-progress", {
        status: "scanning",
        message: "\u6B63\u5728\u626B\u63CF\u6587\u4EF6\u5939...",
        percent: 0
      });
      const scanner = new MediaScanner((progress) => {
        const percent = Math.round(progress.scanned / progress.total * 100);
        event.sender.send("scan-progress", {
          status: "scanning",
          message: `\u6B63\u5728\u5904\u7406: ${progress.scanned}/${progress.total}`,
          percent
        });
      });
      const allFiles = await scanner.scan(result.filePaths);
      const uniqueFiles = /* @__PURE__ */ new Map();
      for (const file of allFiles) {
        if (!uniqueFiles.has(file.path)) {
          uniqueFiles.set(file.path, file);
        }
      }
      const finalFiles = Array.from(uniqueFiles.values());
      for (const f of finalFiles) {
        dbManager.addMedia(f);
      }
      event.sender.send("scan-progress", {
        status: "complete",
        message: `\u5B8C\u6210\uFF0C\u5171\u6DFB\u52A0 ${finalFiles.length} \u4E2A\u6587\u4EF6`,
        percent: 100
      });
      return finalFiles;
    } catch (error) {
      console.error("\u6DFB\u52A0\u6587\u4EF6\u5939\u5931\u8D25:", error);
      event.sender.send("scan-progress", {
        status: "error",
        message: "\u626B\u63CF\u5931\u8D25: " + error.message,
        percent: 0
      });
      throw error;
    }
  });
  import_electron3.ipcMain.handle("scan-media-folder", async () => {
    return import_electron3.ipcMain.emit("add-media-folder");
  });
  import_electron3.ipcMain.handle("rescan-folders", async (event, folderPaths) => {
    try {
      if (folderPaths.length === 0) return [];
      event.sender.send("scan-progress", {
        status: "scanning",
        message: "\u6B63\u5728\u5237\u65B0\u6587\u4EF6\u5939...",
        percent: 0
      });
      const scanner = new MediaScanner((progress) => {
        const percent = Math.round(progress.scanned / progress.total * 100);
        event.sender.send("scan-progress", {
          status: "scanning",
          message: `\u6B63\u5728\u5904\u7406: ${progress.scanned}/${progress.total}`,
          percent
        });
      });
      const allFiles = await scanner.scan(folderPaths);
      const uniqueFiles = /* @__PURE__ */ new Map();
      for (const file of allFiles) {
        if (!uniqueFiles.has(file.path)) {
          uniqueFiles.set(file.path, file);
        }
      }
      const finalFiles = Array.from(uniqueFiles.values());
      const existingMedia = dbManager.getAllMedia();
      const existingPaths = new Set(existingMedia.map((m) => m.path));
      let addedCount = 0;
      for (const f of finalFiles) {
        if (!existingPaths.has(f.path)) {
          dbManager.addMedia(f);
          addedCount++;
        }
      }
      event.sender.send("scan-progress", {
        status: "complete",
        message: `\u5B8C\u6210\uFF0C\u65B0\u589E ${addedCount} \u4E2A\u6587\u4EF6`,
        percent: 100
      });
      return finalFiles;
    } catch (error) {
      console.error("\u5237\u65B0\u6587\u4EF6\u5939\u5931\u8D25:", error);
      event.sender.send("scan-progress", {
        status: "error",
        message: "\u5237\u65B0\u5931\u8D25: " + error.message,
        percent: 0
      });
      throw error;
    }
  });
  import_electron3.ipcMain.handle("get-all-media", () => {
    const media = dbManager.getAllMedia();
    const validPaths = media.map((m) => m.path);
    cleanupThumbnails(validPaths);
    return media;
  });
  import_electron3.ipcMain.handle("delete-media", async (_, mediaId) => {
    try {
      if (!validateMediaId(mediaId)) {
        return { success: false, error: "Invalid mediaId" };
      }
      const media = dbManager.getMediaById(mediaId);
      if (!media) {
        return { success: false, error: "\u5A92\u4F53\u4E0D\u5B58\u5728" };
      }
      if (!import_fs8.default.existsSync(media.path)) {
        dbManager.deleteMedia(mediaId);
        return { success: true, message: "\u5DF2\u4ECE\u6570\u636E\u5E93\u79FB\u9664" };
      }
      await import_electron3.shell.trashItem(media.path);
      dbManager.deleteMedia(mediaId);
      return { success: true, message: "\u5DF2\u79FB\u5165\u56DE\u6536\u7AD9" };
    } catch (error) {
      console.error("\u5220\u9664\u5931\u8D25:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron3.ipcMain.handle("clear-all-media", async () => {
    try {
      dbManager.clearAllMedia();
      return { success: true, message: "\u5A92\u4F53\u5E93\u5DF2\u6E05\u7A7A" };
    } catch (error) {
      console.error("\u6E05\u7A7A\u5A92\u4F53\u5E93\u5931\u8D25:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron3.ipcMain.handle("open-media-folder", async (_, mediaPath) => {
    try {
      if (!mediaPath || typeof mediaPath !== "string") {
        return { success: false, error: "Invalid mediaPath" };
      }
      const normalizedPath = import_path9.default.normalize(mediaPath);
      if (normalizedPath.includes("..")) {
        return { success: false, error: "Invalid path" };
      }
      const folderPath = import_path9.default.dirname(normalizedPath);
      await import_electron3.shell.openPath(folderPath);
      return { success: true };
    } catch (error) {
      console.error("\u6253\u5F00\u76EE\u5F55\u5931\u8D25:", error);
      return { success: false, error: error.message };
    }
  });
}

// src/main/ipc/tags.ts
var import_electron4 = require("electron");
function registerTagHandlers(dbManager) {
  import_electron4.ipcMain.handle(
    "search-media-by-tags",
    (_event, tags) => dbManager.searchByTags(tags)
  );
  import_electron4.ipcMain.handle("add-tag", (_event, mediaId, tag) => {
    if (!validateMediaId(mediaId)) {
      return { success: false, error: "Invalid mediaId" };
    }
    if (!tag || typeof tag !== "string" || tag.length === 0 || tag.length > 50) {
      return { success: false, error: "Invalid tag" };
    }
    dbManager.addTag(mediaId, tag.trim());
    return { success: true };
  });
  import_electron4.ipcMain.handle(
    "remove-tag",
    (_event, mediaId, tag) => {
      if (!validateMediaId(mediaId)) {
        return { success: false, error: "Invalid mediaId" };
      }
      if (!tag || typeof tag !== "string" || tag.length === 0 || tag.length > 50) {
        return { success: false, error: "Invalid tag" };
      }
      dbManager.removeTag(mediaId, tag.trim());
      return { success: true };
    }
  );
}

// src/main/ipc/settings.ts
var import_electron5 = require("electron");
function registerSettingsHandlers() {
  import_electron5.ipcMain.handle("select-output-dir", async (event) => {
    const window = import_electron5.BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;
    const result = await import_electron5.dialog.showOpenDialog(window, {
      properties: ["openDirectory"],
      title: "\u9009\u62E9\u8F93\u51FA\u76EE\u5F55"
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return result.filePaths[0];
  });
  import_electron5.ipcMain.handle("get-data-dir", () => getDefaultDataDir());
  import_electron5.ipcMain.handle("set-data-dir", async (_, dirPath) => {
    const config = getConfig();
    config.dataDir = dirPath;
    saveConfig(config);
    return { success: true };
  });
  import_electron5.ipcMain.handle("select-data-dir", async (event) => {
    const window = import_electron5.BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;
    const result = await import_electron5.dialog.showOpenDialog(window, {
      properties: ["openDirectory"],
      title: "\u9009\u62E9\u6570\u636E\u5B58\u50A8\u76EE\u5F55"
    });
    if (result.canceled) return null;
    return result.filePaths[0] || null;
  });
}

// src/main/ipc/video.ts
var import_electron6 = require("electron");
var import_worker_threads = require("worker_threads");
var activeWorkers = /* @__PURE__ */ new Map();
function registerVideoHandlers() {
  import_electron6.ipcMain.handle("trim-video-start", async (event, params) => {
    const validation = validateTrimParams(params);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const { mode, input, output, start, end } = params;
    const jobId = Date.now().toString();
    const sender = event.sender;
    const window = import_electron6.BrowserWindow.fromWebContents(sender);
    return new Promise((resolve) => {
      const worker = new import_worker_threads.Worker(getWorkerPath());
      activeWorkers.set(jobId, worker);
      worker.on(
        "message",
        (data) => {
          if (data.type === "progress") {
            if (window && !window.isDestroyed()) {
              sender.send("trim-progress", {
                percent: data.percent,
                mode
              });
            }
          } else if (data.type === "complete") {
            activeWorkers.delete(jobId);
            worker.terminate();
            if (window && !window.isDestroyed()) {
              sender.send("trim-complete", data);
            }
            resolve(data);
          }
        }
      );
      worker.on("error", (err) => {
        activeWorkers.delete(jobId);
        const errorData = { success: false, error: err.message };
        if (window && !window.isDestroyed()) {
          sender.send("trim-complete", errorData);
        }
        resolve(errorData);
      });
      worker.postMessage({ mode, input, output, start, end });
    });
  });
  import_electron6.ipcMain.handle("trim-video-cancel", async (_, jobId) => {
    const worker = activeWorkers.get(jobId);
    if (worker) {
      await worker.terminate();
      activeWorkers.delete(jobId);
      return { success: true };
    }
    return { success: false };
  });
}
async function cleanupVideoWorkers() {
  for (const [, worker] of activeWorkers) {
    await worker.terminate();
  }
  activeWorkers.clear();
}

// src/main/ipc/window.ts
var import_electron8 = require("electron");

// src/main/windows/PlaylistWindow.ts
var import_electron7 = require("electron");
var import_path10 = __toESM(require("path"));
var playlistWindow = null;
async function createPlaylistWindow() {
  if (playlistWindow) {
    playlistWindow.focus();
    return playlistWindow;
  }
  const isDev = process.argv.includes("--dev");
  playlistWindow = new import_electron7.BrowserWindow({
    width: 400,
    height: 800,
    minWidth: 300,
    minHeight: 500,
    title: "\u64AD\u653E\u5217\u8868",
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#202020",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: import_path10.default.resolve(__dirname, "../preload.js"),
      webSecurity: !isDev
    },
    show: false
  });
  if (isDev) {
    await playlistWindow.loadURL("http://localhost:5173/playlist.html");
  } else {
    await playlistWindow.loadFile(import_path10.default.join(__dirname, "../../renderer/playlist.html"));
  }
  playlistWindow.show();
  playlistWindow.on("closed", () => {
    playlistWindow = null;
  });
  return playlistWindow;
}
function closePlaylistWindow() {
  if (playlistWindow) {
    playlistWindow.close();
    playlistWindow = null;
  }
}
function getPlaylistWindow() {
  return playlistWindow;
}

// src/main/ipc/window.ts
function registerWindowHandlers() {
  import_electron8.ipcMain.on("minimize-window", (event) => {
    const window = import_electron8.BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
  });
  import_electron8.ipcMain.on("maximize-window", (event) => {
    const window = import_electron8.BrowserWindow.fromWebContents(event.sender);
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });
  import_electron8.ipcMain.on("close-window", (event) => {
    const window = import_electron8.BrowserWindow.fromWebContents(event.sender);
    window?.close();
  });
  import_electron8.ipcMain.handle("create-playlist-window", async (event) => {
    try {
      const window = await createPlaylistWindow();
      const sender = event.sender;
      window.on("closed", () => {
        if (!sender.isDestroyed()) {
          sender.send("playlist-window-closed");
        }
      });
      return true;
    } catch (error) {
      console.error("\u521B\u5EFA\u64AD\u653E\u5217\u8868\u7A97\u53E3\u5931\u8D25:", error);
      return false;
    }
  });
  import_electron8.ipcMain.handle("close-playlist-window", () => {
    closePlaylistWindow();
    return true;
  });
  import_electron8.ipcMain.handle(
    "sync-playlist-data",
    (_event, data) => {
      const playlistWindow2 = getPlaylistWindow();
      if (playlistWindow2 && !playlistWindow2.isDestroyed()) {
        playlistWindow2.webContents.send("sync-playlist-data", data);
      }
      return true;
    }
  );
  import_electron8.ipcMain.on("playlist-action", (_event, action) => {
    const mainWindow2 = getMainWindow();
    if (mainWindow2 && !mainWindow2.isDestroyed()) {
      mainWindow2.webContents.send("playlist-action", action);
    }
  });
  import_electron8.ipcMain.on("minimize-playlist-window", () => {
    const playlistWindow2 = getPlaylistWindow();
    playlistWindow2?.minimize();
  });
  import_electron8.ipcMain.on("maximize-playlist-window", () => {
    const playlistWindow2 = getPlaylistWindow();
    if (playlistWindow2) {
      if (playlistWindow2.isMaximized()) {
        playlistWindow2.unmaximize();
      } else {
        playlistWindow2.maximize();
      }
    }
  });
  import_electron8.ipcMain.on("close-playlist-window-direct", () => {
    const playlistWindow2 = getPlaylistWindow();
    playlistWindow2?.close();
  });
}

// src/main/ipc/index.ts
function registerAllHandlers(dbManager) {
  registerMediaHandlers(dbManager);
  registerTagHandlers(dbManager);
  registerSettingsHandlers();
  registerVideoHandlers();
  registerWindowHandlers();
}

// src/main/utils/menu.ts
var import_electron9 = require("electron");
function createApplicationMenu(window) {
  const template = [
    {
      label: "\u6587\u4EF6",
      submenu: [
        {
          label: "\u6DFB\u52A0\u6587\u4EF6...",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            window.webContents.send("menu-add-files");
          }
        },
        {
          label: "\u6DFB\u52A0\u6587\u4EF6\u5939...",
          accelerator: "CmdOrCtrl+Shift+O",
          click: () => {
            window.webContents.send("menu-add-folder");
          }
        },
        { type: "separator" },
        {
          label: "\u9000\u51FA",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            import_electron9.app.quit();
          }
        }
      ]
    },
    {
      label: "\u89C6\u56FE",
      submenu: [
        {
          label: "\u8BBE\u7F6E",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            window.webContents.send("menu-settings");
          }
        },
        { type: "separator" },
        {
          label: "\u91CD\u65B0\u52A0\u8F7D",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            window.reload();
          }
        },
        {
          label: "\u5207\u6362\u5F00\u53D1\u8005\u5DE5\u5177",
          accelerator: "F12",
          click: () => {
            window.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: "\u7A97\u53E3",
      submenu: [
        {
          label: "\u6700\u5C0F\u5316",
          accelerator: "CmdOrCtrl+M",
          click: () => {
            window.minimize();
          }
        },
        {
          label: "\u5173\u95ED",
          accelerator: "CmdOrCtrl+W",
          click: () => {
            window.close();
          }
        }
      ]
    },
    {
      label: "\u5E2E\u52A9",
      submenu: [
        {
          label: "\u5173\u4E8E",
          click: () => {
            import_electron9.dialog.showMessageBox(window, {
              type: "info",
              title: "\u5173\u4E8E\u5A92\u4F53\u7BA1\u7406\u5668",
              message: "\u5A92\u4F53\u7BA1\u7406\u5668",
              detail: "\u4E00\u4E2A\u7B80\u5355\u6613\u7528\u7684\u672C\u5730\u5A92\u4F53\u7BA1\u7406\u5DE5\u5177",
              buttons: ["\u786E\u5B9A"]
            });
          }
        }
      ]
    }
  ];
  const menu = import_electron9.Menu.buildFromTemplate(template);
  import_electron9.Menu.setApplicationMenu(menu);
}

// src/main/utils/protocol.ts
var import_electron10 = require("electron");
var import_url = require("url");
function registerSchemes() {
  import_electron10.protocol.registerSchemesAsPrivileged([
    {
      scheme: "media",
      privileges: {
        secure: true,
        supportFetchAPI: true,
        standard: true,
        bypassCSP: true,
        stream: true
      }
    }
  ]);
}
function registerProtocols() {
  import_electron10.protocol.handle("media", (req) => {
    const url = req.url.replace(/^media:\/\//, "");
    const decodedUrl = decodeURIComponent(url);
    let filePath = decodedUrl;
    if (process.platform === "win32" && filePath.startsWith("/") && !filePath.startsWith("//")) {
      filePath = filePath.slice(1);
    }
    return import_electron10.net.fetch((0, import_url.pathToFileURL)(filePath).toString());
  });
}

// src/main/index.ts
registerSchemes();
function initializeFfmpeg() {
  import_fluent_ffmpeg3.default.setFfmpegPath(getFfmpegPath());
  import_fluent_ffmpeg3.default.setFfprobePath(getFfprobePath());
}
import_electron11.app.whenReady().then(async () => {
  initializeFfmpeg();
  registerProtocols();
  const dbManager = new DatabaseManager(getDefaultDataDir());
  registerAllHandlers(dbManager);
  const isDev = process.argv.includes("--dev");
  const mainWindow2 = await createMainWindow(isDev);
  createApplicationMenu(mainWindow2);
  mainWindow2.webContents.on("preload-error", (_event, preloadPath, error) => {
    console.error("[Main] Preload error:", preloadPath, error);
  });
  mainWindow2.webContents.on("console-message", (_event, level, message) => {
    console.log(`[Renderer:${level}] ${message}`);
  });
  console.log("[Main] App initialized");
}).catch(console.error);
import_electron11.app.on("before-quit", async () => {
  await cleanupVideoWorkers();
  closePlaylistWindow();
});
import_electron11.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") import_electron11.app.quit();
});
/*! Bundled license information:

sharp/lib/is.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/libvips.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/sharp.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/constructor.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/input.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/resize.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/composite.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/operation.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/colour.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/channel.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/output.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/utility.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/index.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)
*/
