import * as intro from './intro.mjs';
import * as halftime from './halftime.mjs';
import * as seasonSummary from './seasonSummary.mjs';

const Overlays = {
  ...intro,
  ...halftime,
  ...seasonSummary,
};

window.FootLab = window.FootLab || {};
window.FootLab.Overlays = window.FootLab.Overlays || {};
Object.assign(window.FootLab.Overlays, Overlays);
// Backwards compatibility: keep old global available
window.Elifoot = window.Elifoot || window.FootLab;

export default Overlays;
