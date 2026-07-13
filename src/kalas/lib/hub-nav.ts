import type { ScreenId } from '../Shell';
import {
  HUB_CAT_KEY,
  HUB_TAB_KEY,
  isLegacyHubScreen,
  legacyScreenToHub,
  type HubCat,
  type HubTab,
} from '../screens/team/shared';

export type NavigateTarget = ScreenId | 'venues' | 'vendors' | 'inbox';

export function navigateToHub(tab: HubTab, cat?: HubCat) {
  sessionStorage.setItem(HUB_TAB_KEY, tab);
  if (cat) sessionStorage.setItem(HUB_CAT_KEY, cat);
}

/** Map legacy screen ids to the unified team hub before navigation. */
export function resolveScreenNavigation(target: NavigateTarget): ScreenId {
  if (isLegacyHubScreen(target)) {
    const { tab, cat } = legacyScreenToHub(target);
    navigateToHub(tab, cat);
    return 'team';
  }
  return target;
}

export function migrateSavedScreen(saved: string | null): ScreenId | null {
  if (!saved) return null;
  if (saved === 'ava' || saved === 'inspiration') return 'home';
  if (isLegacyHubScreen(saved)) {
    const { tab, cat } = legacyScreenToHub(saved);
    navigateToHub(tab, cat);
    return 'team';
  }
  return saved as ScreenId;
}
