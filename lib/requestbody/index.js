const requestbody = function (req, res, err) {
  req.on('end', () => {
    try {
      req.body = req.body ? JSON.parse(req.body) : {}
    } catch (e) {
      req.body = {}
    }
  })
}

module.exports = requestbody