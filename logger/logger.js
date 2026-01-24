import log4js from 'log4js';
import path from 'path';

log4js.configure({
  appenders: {
    console: {
      type: "console"
    },
    appFile: {
      type: "dateFile",
      filename: path.join("logs", "app.log"),
      pattern: "yyyy-MM-dd",
      compress: true,
      keepFileExt: true,
      daysToKeep: 14
    },
    errorFile: {
      type: "dateFile",
      filename: path.join("logs", "error.log"),
      pattern: "yyyy-MM-dd",
      compress: true,
      keepFileExt: true,
      daysToKeep: 30
    }
  },
  categories: {
    default: {
      appenders: ["console", "appFile"],
      level: "debug"
    },
    error: {
      appenders: ["console", "errorFile"],
      level: "error"
    }
  }
});

const logger = log4js.getLogger();
const errorLogger = log4js.getLogger("error");

export default {
  info: (message) => logger.info(message),
  error: (message) => errorLogger.error(message),
  warn: (message) => logger.warn(message),
  debug: (message) => logger.debug(message)
};
