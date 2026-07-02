/**
 * Canvas Manifest — Magic Patterns tooling
 *
 * This file is used by the Magic Patterns canvas to map screen IDs
 * to routes and positions. Do not delete — it's read by useScreenInit.
 * Do not import this in production components.
 *
 * Routes updated to match Next.js App Router paths (no /app prefix).
 */

export const manifest = {
    screens: {
        scr_52ws19: { name: 'Login',         route: '/login',         position: { x: 160,  y: 220  } },
        scr_sqejfd: { name: 'Onboarding',    route: '/onboarding',    position: { x: 1560, y: 220  } },
        scr_o2muay: { name: 'Dashboard',     route: '/dashboard',     position: { x: 160,  y: 2200 } },
        scr_o716oi: { name: 'Students',      route: '/students',      position: { x: 160,  y: 4180 } },
        scr_pzs32p: { name: 'Teachers',      route: '/teachers',      position: { x: 1560, y: 4180 } },
        scr_isozo3: { name: 'Classes',       route: '/classes',       position: { x: 160,  y: 6160 } },
        scr_zka9es: { name: 'Attendance',    route: '/attendance',    position: { x: 1560, y: 6160 } },
        scr_w0k2z4: { name: 'Results',       route: '/results',       position: { x: 2960, y: 6160 } },
        scr_i630ho: { name: 'Timetable',     route: '/timetable',     position: { x: 4360, y: 6160 } },
        scr_jsp5cn: { name: 'Parents',       route: '/parents',       position: { x: 2960, y: 4180 } },
        scr_pwpnuh: { name: 'Roles',         route: '/roles',         position: { x: 160,  y: 8140 } },
        scr_svlv2p: { name: 'Announcements', route: '/announcements', position: { x: 160,  y: 10120 } },
        scr_mi3od6: { name: 'Settings',      route: '/settings',      position: { x: 160,  y: 12100 } },
    },
    sections: {
        sec_9vssnj: { name: 'Authentication flow',  x: 0, y: 0,     width: 2920, height: 1180 },
        sec_qsb5fe: { name: 'Dashboard',            x: 0, y: 1980,  width: 1520, height: 1180 },
        sec_8kiedq: { name: 'User management',      x: 0, y: 3960,  width: 4320, height: 1180 },
        sec_dbce2w: { name: 'Classes & academics',  x: 0, y: 5940,  width: 5720, height: 1180 },
        sec_oeuv8k: { name: 'Administration',       x: 0, y: 7920,  width: 1520, height: 1180 },
        sec_szamor: { name: 'Communications',       x: 0, y: 9900,  width: 1520, height: 1180 },
        sec_aw4x39: { name: 'Settings',             x: 0, y: 11880, width: 1520, height: 1180 },
    },
    layers: [
        { kind: 'section', id: 'sec_9vssnj', children: [{ kind: 'screen', id: 'scr_52ws19' }, { kind: 'screen', id: 'scr_sqejfd' }] },
        { kind: 'section', id: 'sec_qsb5fe', children: [{ kind: 'screen', id: 'scr_o2muay' }] },
        { kind: 'section', id: 'sec_8kiedq', children: [{ kind: 'screen', id: 'scr_o716oi' }, { kind: 'screen', id: 'scr_pzs32p' }, { kind: 'screen', id: 'scr_jsp5cn' }] },
        { kind: 'section', id: 'sec_dbce2w', children: [{ kind: 'screen', id: 'scr_isozo3' }, { kind: 'screen', id: 'scr_zka9es' }, { kind: 'screen', id: 'scr_w0k2z4' }, { kind: 'screen', id: 'scr_i630ho' }] },
        { kind: 'section', id: 'sec_oeuv8k', children: [{ kind: 'screen', id: 'scr_pwpnuh' }] },
        { kind: 'section', id: 'sec_szamor', children: [{ kind: 'screen', id: 'scr_svlv2p' }] },
        { kind: 'section', id: 'sec_aw4x39', children: [{ kind: 'screen', id: 'scr_mi3od6' }] },
    ],
};
