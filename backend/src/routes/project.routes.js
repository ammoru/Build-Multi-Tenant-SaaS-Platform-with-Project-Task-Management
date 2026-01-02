const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/project.controller');

router.post('/', auth, controller.createProject);
router.get('/', auth, controller.listProjects);
router.put('/:projectId', auth, controller.updateProject);
router.delete('/:projectId', auth, controller.deleteProject);

module.exports = router;
