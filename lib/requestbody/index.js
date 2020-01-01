const requestbody = function (req, res, err) {
  req.on('end', () => {
    try {
      req.query = req.query ? JSON.parse(req.query) : {}
    } catch (e) {
      req.query = {}
    }
    try {
      req.headers = req.headers ? JSON.parse(req.headers) : {}
    } catch (e) {
      req.headers = {}
    }
    try {
      req.body = req.body ? JSON.parse(req.body) : {}
    } catch (e) {
      req.body = {}
    }
  })
}

module.exports = requestbody