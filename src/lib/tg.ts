import WebApp from '@twa-dev/sdk';
export const tg = WebApp;

export function initTelegram() {
  tg.ready();
  tg.expand();
  tg.disableVerticalSwipes?.();
}

export function setMainButton(text: string, onClick: () => void) {
  tg.MainButton.setParams({ text, is_visible: true });
  tg.MainButton.onClick(onClick);
}

export function clearMainButton() {
  tg.MainButton.hide();
  tg.MainButton.offClick(() => {}); // clears all listeners
}

export function userFromInitData() {
  return tg.initDataUnsafe?.user;
}
