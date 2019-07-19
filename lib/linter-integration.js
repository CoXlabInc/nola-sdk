'use babel';

const XRegExp = require('xregexp');

class Linter {
  constructor(registerIndie) {
    this.linter = registerIndie({ name: 'Nol.A' });
  }
  destroy() {
    this.linter.dispose();
  }
  clear() {
    this.linter.clearMessages();
  }
  processMessages(buildResult, stdout, stderr) {
    let allMessages = [];
    let errorLines = stderr.split('\n');

    const gccErrorMatch = XRegExp('(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):(?<col>\\d+): (?<severity>\\s*(fatal error|error|warning)):\\s*(?<message>.+)');

    for (let i = 0; i < errorLines.length; i++) {
      result = XRegExp.exec(errorLines[i], gccErrorMatch);
      if (result) {
        if (result.severity === 'fatal error') {
          result.severity = 'error';
        }
        if (result.severity === 'warning' || result.severity === 'error') {
          allMessages.push({
            severity: result.severity,
            location: {
              file: result.file,
              position: [
                [result.line - 1, result.col - 1],
                [result.line - 1, result.col - 1]
              ],
            },
            excerpt: result.message,
            description: ''
          });
        }
      } else if (
        allMessages.length > 0
        && !errorLines[i].startsWith('make:')
        && !errorLines[i].startsWith('[Nol.A]')
      ) {
        let last = allMessages[allMessages.length - 1];
        last.description += `\n${errorLines[i]}`;
        allMessages[allMessages.length - 1] = last;
      }
    }

    for (let i = 0; i < allMessages.length; i++) {
      let msg = allMessages[i];
      if (msg.description !== '') {
        msg.description = '```' + msg.description + '\n```';
      }
      allMessages[i] = msg;
    }
    this.linter.setAllMessages(allMessages);
  }
}

export default Linter;
