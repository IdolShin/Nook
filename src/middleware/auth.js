const jwt = require('jsonwebtoken')

// Verify JWT — attach business info to req.business
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.business = decoded   // { id, email, name, plan }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Scanner-only: lighter check — staff can scan without full dashboard access
const scannerMiddleware = (req, res, next) => {
  const token = req.headers['x-scanner-token'] || req.query.token
  if (!token) return res.status(401).json({ error: 'No scanner token' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.business = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid scanner token' })
  }
}

module.exports = { authMiddleware, scannerMiddleware }
