import * as intro from './intro.mjs';
import * as halftime from './halftime.mjs';
import * as seasonSummary from './seasonSummary.mjs';

const Overlays = {
  ...intro,
  ...halftime,
  ...seasonSummary,
};

if (!window.Elifoot) window.Elifoot = {};
if (!window.Elifoot.Overlays) window.Elifoot.Overlays = {};
Object.assign(window.Elifoot.Overlays, Overlays);

export default Overlays;
