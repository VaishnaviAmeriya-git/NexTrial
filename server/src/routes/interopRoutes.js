const express = require('express');
const { Trial } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess } = require('../middleware/rbac');
const FHIRService = require('../services/fhirService');
const CDISCService = require('../services/cdiscService');

const router = express.Router();

router.use(authenticate);

// GET /trials/:id/export/fhir
router.get('/trials/:id/export/fhir', requireTrialAccess, async (req, res, next) => {
  try {
    const bundle = await FHIRService.exportTrialAsFHIR(req.params.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="nextrial-fhir-r4-${req.params.id}.json"`);
    res.status(200).json(bundle);
  } catch (err) {
    next(err);
  }
});

// GET /trials/:id/export/cdisc
router.get('/trials/:id/export/cdisc', requireTrialAccess, async (req, res, next) => {
  try {
    const cdisc = await CDISCService.exportTrialAsCDISC(req.params.id);
    const domain = req.query.domain; // 'DM' | 'AE' | 'EX' | 'AY'

    if (domain && cdisc.datasets[domain.toUpperCase()]) {
      const csvData = cdisc.datasets[domain.toUpperCase()];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${cdisc.trialCode}_${domain.toUpperCase()}.csv"`);
      return res.status(200).send(csvData);
    }

    // Default: return JSON bundle of all 4 SDTM-inspired domain CSVs
    res.status(200).json({
      success: true,
      trialCode: cdisc.trialCode,
      message: 'CDISC SDTM-inspired CSV export (prototype). Contains DM, AE, EX, and AY custom domains.',
      domains: {
        DM: cdisc.datasets.DM,
        AE: cdisc.datasets.AE,
        EX: cdisc.datasets.EX,
        AY: cdisc.datasets.AY,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
