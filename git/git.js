const path = require('path')
const gitUi = require('./git-ui/git-ui')

module.exports = (RED) => {
  function gitUiNode(config) {
    RED.nodes.createNode(this, config)
  }
  RED.nodes.registerType('git-ui', gitUiNode)

  RED.httpNode.get('/git-ui/git-ui.html', (req, res) => {
    const filename = path.join(__dirname, 'git-ui', 'git-ui.html')
    gitUi.sendFile(res, filename)
  })

  RED.httpNode.post('/git-ui/commit', (req, res) => {
    const userDir = RED.settings.userDir || RED.rocess.env.NODE_RED_HOME
    gitUi.commit(userDir, req.body.message).then((result) => {
      res.status(200).send({ status: 'OK', result })
    }).catch((err) => {
      res.status(500).send(err)
    })
  })

  RED.httpNode.get('/git-ui/git-ui.css', (req, res) => {
    const filename = path.join(__dirname, 'git-ui', 'git-ui.css')
    gitUi.sendFile(res, filename)
  })

  RED.httpNode.get('/git-ui/logs/:branchName', (req, res) => {
    gitUi.logs(req.params.branchName).then((logList) => {
      res.status(200).send({ commits: logList.all })
    }).catch((err) => {
      res.status(500).send({ error: err })
    })
  })

  RED.httpNode.get('/git-ui/branches', (req, res) => {
    gitUi.branches().then((branchList) => {
      res.status(200).send({ branches: branchList.all, current: branchList.current })
    }).catch((err) => {
      res.status(500).send({ error: err })
    })
  })

  RED.httpNode.put('/git-ui/checkout/:branchName', (req, res) => {
    const userDir = RED.settings.userDir || RED.process.env.NODE_RED_HOME
    gitUi.cwd(userDir).then(() => {
      gitUi.checkout(req.params.branchName).then(() => {
        res.status(200).send({ status: 'OK' })
      }).catch((err) => {
        res.status(500).send({ error: err })
      })
    }).catch((err) => {
      res.status(500).send({ error: err })
    })
  })

  RED.httpNode.get('/git-ui/show/:hash/:fileName', (req, res) => {
    gitUi.show(req.params.hash, req.params.fileName).then((object) => {
      res.status(200).send({ object })
    }).catch((err) => {
      res.status(500).send({ error: err })
    })
  })

  RED.httpNode.get('/git-ui/show/:hash', (req, res) => {
    gitUi.show(req.params.hash, RED.settings.get('flowFile') || 'flows_' + require('os').hostname() + '.json').then((object) => {
      res.status(200).send({ object })
    }).catch((err) => {
      res.status(500).send({ error: err })
    })
  })

  RED.httpNode.get('/git-ui/status', (req, res) => {
    gitUi.status().then((statusSummary) => {
      res.status(200).send({ statusSummary })
    }).catch((err) => {
      res.status(500).send({ error: err })
    })
  })

  RED.httpNode.get('/git-ui/remote', (req, res) => {
    gitUi.remoteGet().then((url) => {
      res.status(200).send({ url })
    }).catch((err) => {
      res.status(500).send({ error: err })
    })
  })

  RED.httpNode.put('/git-ui/remote', (req, res) => {
    gitUi.remoteSet(req.body.url).then((url) => {
      res.status(200).send({ url })
    }).catch((err) => {
      res.status(500).send({ error: err })
    })
  })

  RED.httpNode.get('/git-ui/fetch', (req, res) => {
    gitUi.fetch().then(() => {
      res.status(204).send()
    }).catch((err) => {
      res.status(500).send({ error: err })
    })
  })

  RED.httpNode.get('/git-ui/pull', (req, res) => {
    gitUi.pull().then(() => {
      res.status(204).send()
    }).catch((err) => {
      res.status(500).send({ error: err })
    })
  })

  RED.httpNode.put('/git-ui/update/:branchName', (req, res) => {
    gitUi.update(req.params.branchName, req.query.force || false).then((url) => {
      res.status(200).send({ url })
    }).catch((err) => {
      res.status(500).send({ error: err })
    })
  })

  RED.httpNode.put('/git-ui/createLocalRepo', (req, res) => {
    const userDir = RED.settings.userDir || RED.rocess.env.NODE_RED_HOME
    gitUi.createLocalRepo(userDir).then((url) => {
      res.status(200).send({ status: 'OK' })
    }).catch((err) => {
      res.status(500).send(err)
    })
  })
}
