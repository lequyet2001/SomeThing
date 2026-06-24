import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import {
  Bell,
  CheckCheck,
  CreditCard,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  User,
  UserPlus,
  X,
  HomeIcon,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import type {
  EntityId,
  User as ShopUser,
  UserNotification,
} from "../types/shop";

function formatNotificationDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Header({
  cartCount,
  notifications = [],
  unreadNotificationCount = 0,
  user,
  onDeleteNotification,
  onLogout,
  onMarkAllNotificationsRead,
  onOpenNotification,
}: {
  cartCount: number;
  notifications?: UserNotification[];
  unreadNotificationCount?: number;
  user: ShopUser | null;
  onDeleteNotification?: (notificationId: EntityId) => void;
  onLogout: () => void;
  onMarkAllNotificationsRead?: () => void;
  onOpenNotification?: (notification: UserNotification) => void;
}) {
  const { language, t, toggleLanguage } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleOutsideClick(event: globalThis.MouseEvent | TouchEvent) {
      if (
        event.target instanceof Node &&
        !headerRef.current?.contains(event.target)
      ) {
        closeMenus();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const closeMenus = () => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
    setShowNotifications(false);
  };

  const goTo = (path: string) => {
    closeMenus();
    navigate(path);
  };

  const handleLogout = () => {
    closeMenus();
    onLogout();
  };

  const handleUserInfo = () => {
    goTo("/account");
  };

  const handleOpenNotification = (notification: UserNotification) => {
    closeMenus();
    onOpenNotification?.(notification);
  };

  const handleMarkAllNotificationsRead = () => {
    onMarkAllNotificationsRead?.();
  };

  const handleDeleteNotification = (
    event: MouseEvent<HTMLButtonElement>,
    notificationId: EntityId,
  ) => {
    event.stopPropagation();
    onDeleteNotification?.(notificationId);
  };

  const navLinkClass =
    "inline-flex h-10 items-center justify-start gap-2 rounded-md border border-transparent bg-transparent px-3 text-sm font-black text-muted transition hover:border-line hover:bg-white hover:text-primaryDark aria-[current=page]:border-primary/30 aria-[current=page]:bg-primary/10 aria-[current=page]:text-primaryDark md:justify-center";
  const menuButtonClass =
    "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-black text-ink shadow-soft transition hover:border-primary hover:bg-surfaceMuted hover:text-primaryDark";
  const dropdownClass =
    "absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-line bg-white p-3 shadow-panel";

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-line/80 bg-white/90 px-4 py-3 shadow-soft backdrop-blur-xl md:px-8"
    >
      <div className="mx-auto flex w-full space-x-3 items-center gap-[3rem]">
        <div className="flex items-center gap-3 ">
          <button
            className="group border-0 bg-transparent p-0 text-left shadow-none"
            onClick={() => goTo("/")}
          >
            <span className="block text-xl font-black tracking-wide text-primaryDark transition group-hover:text-primary">Marseille04</span>
            <span className="hidden text-xs font-black uppercase tracking-wide text-muted sm:block">Shop</span>
          </button>
        </div>
        <button
          className="inline-flex size-11 items-center justify-center rounded-md border border-line bg-white text-primaryDark shadow-soft md:hidden"
          type="button"
          aria-expanded={showMobileMenu}
          aria-label={
            showMobileMenu ? t("header.closeMenu") : t("header.openMenu")
          }
          onClick={() => setShowMobileMenu((current) => !current)}
        >
          {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div
          className={`${showMobileMenu ? "flex" : "hidden"} fixed inset-x-4 top-16 z-50 max-h-[78vh] flex-col gap-4 overflow-y-auto rounded-md border border-line bg-white/95 p-4 shadow-panel backdrop-blur md:static md:flex md:max-h-none md:flex-1 md:flex-row md:items-center md:justify-between md:overflow-visible md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0`}
        >
        <nav
          className="flex flex-col gap-1 rounded-md bg-surfaceMuted p-1 md:flex-row md:items-center md:bg-transparent md:p-0"
          aria-label={t("header.nav")}
        >
          <NavLink className={navLinkClass} to="/" onClick={closeMenus}>
            <HomeIcon size={17} /> <span>{t("common.home")}</span>
          </NavLink>
          <NavLink className={navLinkClass} to="/shop" onClick={closeMenus}>
            <ShoppingBag size={17} /> <span>{t("common.products")}</span>
          </NavLink>
          <NavLink
            className={navLinkClass}
            to="/cart"
            onClick={closeMenus}
            data-cart-target
          >
            <ShoppingCart size={17} />{" "}
            <span>{t("header.cartCount", { count: cartCount })}</span>
          </NavLink>
          <NavLink className={navLinkClass} to="/checkout" onClick={closeMenus}>
            <CreditCard size={17} /> <span>{t("common.checkout")}</span>
          </NavLink>
          <NavLink className={navLinkClass} to="/contact" onClick={closeMenus}>
            <Mail size={17} /> <span>{t("common.contact")}</span>
          </NavLink>
          {user?.role === "admin" && (
            <NavLink
              className={navLinkClass}
              to="/admin/overview"
              onClick={closeMenus}
            >
              <LayoutDashboard size={17} /> <span>{t("common.admin")}</span>
            </NavLink>
          )}
        </nav>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <button
            className={`${menuButtonClass} border-primary bg-primary/10 text-primaryDark`}
            type="button"
            aria-label={t("language.switch")}
            onClick={toggleLanguage}
          >
            {language === "vi" ? "EN" : "VI"}
          </button>
          {user ? (
            <>
              <div className="relative">
                <button
                  className={`${menuButtonClass} relative size-11 px-0`}
                  type="button"
                  aria-expanded={showNotifications}
                  aria-label={t("header.notifications")}
                  onClick={() => {
                    setShowNotifications((current) => !current);
                    setShowUserMenu(false);
                  }}
                >
                  <Bell size={17} />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-black text-white">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className={dropdownClass}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <strong>{t("header.notifications")}</strong>
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        disabled={unreadNotificationCount === 0}
                      >
                        <CheckCheck size={15} />
                        {t("header.markAllRead")}
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="rounded-md border border-dashed border-line bg-surfaceMuted p-6 text-center font-extrabold text-muted">
                        {t("header.noNotifications")}
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {notifications.slice(0, 8).map((notification) => (
                          <article
                            key={notification.id}
                            className={`flex items-start gap-3 rounded-md border border-line bg-white p-3 shadow-soft ${notification.isRead ? "" : "border-primary/30 bg-blue-50"}`.trim()}
                          >
                            <button
                              type="button"
                              className="flex flex-1 items-start gap-3 border-0 bg-transparent p-0 text-left shadow-none"
                              onClick={() =>
                                handleOpenNotification(notification)
                              }
                            >
                              <span aria-hidden="true" />
                              <div>
                                <strong>{notification.title}</strong>
                                <p>{notification.message}</p>
                                <small>
                                  {formatNotificationDate(
                                    notification.createdAt,
                                  )}
                                </small>
                              </div>
                            </button>
                            <button
                              type="button"
                              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-white text-muted shadow-soft hover:border-primary hover:text-primaryDark"
                              aria-label={t("header.deleteNotification")}
                              onClick={(event) =>
                                handleDeleteNotification(event, notification.id)
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div
                className="relative"
                onMouseEnter={() => {
                  setShowUserMenu(true);
                  setShowNotifications(false);
                }}
              >
                <button
                  className={menuButtonClass}
                  type="button"
                  onClick={() => setShowUserMenu((current) => !current)}
                >
                  {user.avatar ? (
                    <img
                      className="size-7 rounded-full object-cover"
                      src={user.avatar}
                      alt=""
                    />
                  ) : (
                    <User size={17} />
                  )}
                  <span>{user.name}</span>
                </button>
                {showUserMenu && (
                  <div
                    className={`${dropdownClass} grid gap-3`}
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <button
                      className={menuButtonClass}
                      onClick={handleUserInfo}
                    >
                      <User size={16} /> {t("header.accountInfo")}
                    </button>
                    <button
                      className={menuButtonClass}
                      onClick={() => goTo("/cart")}
                      data-cart-target
                    >
                      <ShoppingCart size={16} />{" "}
                      {t("header.cartCount", { count: cartCount })}
                    </button>
                    <button
                      className={`${menuButtonClass} text-red-700`}
                      onClick={handleLogout}
                    >
                      <LogOut size={16} /> {t("common.logout")}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                className={menuButtonClass}
                onClick={() => goTo("/login")}
              >
                <LogIn size={17} /> {t("common.login")}
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:border-primaryDark hover:bg-primaryDark hover:text-white hover:shadow-panel focus:outline-none focus:ring-4 focus:ring-primary/20"
                onClick={() => goTo("/register")}
              >
                <UserPlus size={17} /> {t("common.register")}
              </button>
            </>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
