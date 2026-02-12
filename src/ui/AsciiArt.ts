import { shades } from "./theme.js";

const { light, medium, dark, full } = shades;

/**
 * Compact ASCII eye — 5 lines, pure ASCII + block chars.
 */
export const EYE_LOGO = [
	"      _.---._",
	`    .'   ${dark}${full}${full}${full}   '.`,
	`   /  ${dark}${full}${full}  ${medium}(${full})${medium}  ${dark}${full}${full}  \\`,
	`    '.   ${dark}${full}${full}${full}   .'`,
	`      '-.___.-'`,
].join("\n");

/**
 * Compact banner for subsequent renders.
 */
export const BANNER_COMPACT = `${dark}${full}${dark} OBSERVE-CLAUDE ${dark}${full}${dark}`;

/**
 * Title text with warez-style decorations.
 */
export const TITLE = [
	`${medium}${dark}${full}${full}${dark}${medium}  ╔═══════════════════════════════════╗  ${medium}${dark}${full}${full}${dark}${medium}`,
	`${dark}${full}${full}${dark}    ║   O B S E R V E - C L A U D E   ║    ${dark}${full}${full}${dark}`,
	`${medium}${dark}${full}${full}${dark}${medium}  ╚═══════════════════════════════════╝  ${medium}${dark}${full}${full}${dark}${medium}`,
	`           ${light} read-only session monitor ${light}`,
].join("\n");

/**
 * Full banner: eye logo + title, used in the launch bottom-left pane.
 */
export const FULL_BANNER = `${EYE_LOGO}\n\n${TITLE}`;

/**
 * Divider line with decoration.
 */
export const DIVIDER = `${light}${medium}${dark}${full}═══════════════════════════════════════════${full}${dark}${medium}${light}`;
