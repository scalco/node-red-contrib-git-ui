const git = require('simple-git')()
const moment = require('moment');
const fs = require('fs')
const exec = require('child_process').exec

const remote = 'origin'
const branch = 'staging'
const fileDoesNotExist = 'ENOENT'
const successInitMessage = 'init written successfully'

module.exports = {
  commit: (userDir, message) => new Promise((resolve, reject) => {
    git.add('--all').commit(message).push(remote, branch, (ex, data) => {
      if (ex) {
        reject(ex)
      } else {
        resolve(data)
      }
    })
  }),

  createLocalRepo: (userDir) => new Promise((resolve, reject) => {
    if (!fs.existsSync(`${userDir}/.git`)) {
      git.init()
    }
  }),

  sendFile: (res, filename) => {
    // Use the right function depending on Express 3.x/4.x
    if (res.sendFile) {
      res.sendFile(filename)
    } else {
      res.sendfile(filename)
    }
  },

  tags: () => new Promise((resolve, reject) => {
    git.tags({}, (err, tags) => {
      if (err) {
        reject(err)
      } else {
        resolve(tags)
      }
    })
  }),

  logs: branchName => new Promise((resolve, reject) => {
    git.log([branchName], (err, result) => {
      if (err) {
        reject(err)
      } else {
        result.all.forEach(commit => {
          commit.whencommitted = ' ' + moment(commit.date, "YYYY-MM-DD hh:mm:ss").fromNow();
        })
        resolve(result)
      }
    })
  }),

  branches: () => new Promise((resolve, reject) => {
    git.branch(['-vv'], (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  }),

  checkout: branchName => new Promise((resolve, reject) => {
    git.checkout(branchName, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  }),

  show: (hash, fileName) => new Promise((resolve, reject) => {
    git.show([`${hash}:${fileName}`], (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  }),

  status: () => new Promise((resolve, reject) => {
    git.status((err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  }),

  cwd: dir => new Promise((resolve, reject) => {
    try {
      git.cwd(dir)
      resolve(dir)
    } catch (e) {
      reject(e)
    }
  }),

  remoteGet: () => new Promise((resolve, reject) => {
    git.getRemotes(true, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result[0].refs.push)
      }
    })
  }),

  remoteSet: url => new Promise((resolve, reject) => {
    git.getRemotes(true, (err, result) => {
      if (err) {
        reject(err)
      } else {
        if (!result.filter((r) => { return r.name === 'origin' })[0]) {
          git.raw(['remote', 'add', remote, url], (err) => {
            if (err) {
              reject(err)
            } else {
              resolve(url)
            }
          })
        } else {
          git.raw(['remote', 'set-url', remote, url], (err) => {
            if (err) {
              reject(err)
            } else {
              resolve(url)
            }
          })
        }
      }
    })
  }),

  fetch: () => new Promise((resolve, reject) => {
    git.fetch(['--all'], (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  }),

  update: (branchName, force) => new Promise((resolve, reject) => {
    git.fetch(['--all']).raw(['branch', '-r'], (err, result) => {
      if (err) {
        reject(err)
      } else {
        // if the branch does not exist on remote, create an empty commit and push the branch to remote
        if (!result || !result.split('\n').filter((b) => { return b.substring(b.indexOf('/') + 1) === branchName })[0]) {
          git.checkoutLocalBranch(branchName, (err) => {
            if (err) {
              reject(err)
            } else {
              git.commit('first commit', null, { '--allow-empty': true }, (err) => {
                if (err) {
                  reject(err)
                } else {
                  git.raw(['push', '--set-upstream', `${remote}/${branchName}`], (err) => {
                    if (err) {
                      reject(err)
                    } else {
                      resolve()
                    }
                  })
                }
              })
            }
          })
        } else {
          git.status((err, statusSummary) => {
            if (err) {
              reject(err)
            } else {
              // if the branch exists, update the local repo
              if (force) {
                // discards all local changes
                git.reset(['--hard', `${remote}/${branch}`], (err) => {
                  if (err) {
                    reject(err)
                  }
                }).raw(['clean', '-d', '-f'], (err) => {
                  if (err) {
                    reject(err)
                  }
                })
              }
              // if not on branch staging, checks out origin/staging
              if (statusSummary.tracking !== `${remote}/${branch}`) {
                git.checkout(branchName, (err, result) => {
                  if (err) {
                    reject(err)
                  }
                })
              }
              // pulls
              git.pull((err) => {
                if (err) {
                  reject(err)
                } else {
                  resolve()
                }
              })
              // installs additional nodes according to the generated package.json
              exec('npm install', (error, stdout, stderr) => {
                if (error) {
                  reject(error)
                }
              })
            }
          })
        }
      }
    })
  })
}
