export interface TourStep {
  id: string;
  title: string;
  body: string;
  // The data-tour value of the element to spotlight, or null for a step
  // that has no single element to point at (shown as a centered card
  // instead).
  target: string | null;
  // Route the step's target lives on. Omit for chrome that's present on
  // every page (sidebar footer controls).
  route?: "/" | "/groups";
  // True when the target lives inside AppSidebarShell's footer/nav/tree —
  // on a phone-width viewport that content only exists inside the
  // collapsible hamburger drawer, so the tour needs to force it open for
  // this step and closed again for every other step.
  sidebarChrome?: boolean;
  // True when the target lives inside the topbar's "⋮ More actions"
  // dropdown — the tour forces that menu open for this step and closed
  // again for every other step, the same way sidebarChrome does for the
  // mobile drawer.
  moreMenu?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to The Rounds",
    body: "A quick walkthrough of everything the app can do. Use Next and Back to move around, or Skip tour to leave anytime — you can always reopen this from the Help button.",
    target: null,
  },
  {
    id: "nav",
    title: "My Binder & Groups",
    body: "These two tabs are the whole app. My Binder is your own private set of flashcards. Groups is where you see cards classmates have shared with you.",
    target: "nav-links",
    route: "/",
    sidebarChrome: true,
  },
  {
    id: "tree",
    title: "Subjects, Topics, and Folders",
    body: "Your binder is organized three levels deep: a Subject (like Pharmacology) holds Topics (like Antibiotics), and each Topic holds Folders for the exam period. Prelims, Midterms, and Finals are created for you automatically whenever you start a new Topic — you can rename any of them, or add your own.",
    target: "sidebar-tree",
    route: "/",
    sidebarChrome: true,
  },
  {
    id: "new-entry",
    title: "Add a flashcard",
    body: "Tap + New entry to add a card. Pick — or type a brand-new — Subject, Topic, and Folder, then fill in the term to memorize and a short description.",
    target: "new-entry-button",
    route: "/",
  },
  {
    id: "quiz",
    title: "Quiz yourself",
    body: "Quiz mode reviews your cards two ways: type the answer yourself, or flip the card and grade your own recall. Pick which subjects, topics, or folders to include before you start — nothing about a quiz session is saved, so quiz again anytime.",
    target: "quiz-button",
    route: "/",
  },
  {
    id: "more-menu",
    title: "More actions",
    body: "Tap here for everything else — let's look inside.",
    target: "more-menu-button",
    route: "/",
  },
  {
    id: "more-menu-select",
    title: "Select",
    body: "Turns on checkboxes across your cards so you can move or share a batch of them at once, or delete several in one go.",
    target: "select-toggle-button",
    route: "/",
    moreMenu: true,
  },
  {
    id: "more-menu-upload",
    title: "Upload .md",
    body: "Paste your notes into an LLM using the built-in prompt, save its reply as a .md file, then upload it here — it's parsed into candidate flashcards you review and check off before they're added.",
    target: "upload-md-menu-item",
    route: "/",
    moreMenu: true,
  },
  {
    id: "more-menu-duplicates",
    title: "Check duplicates",
    body: "Scans your whole binder — and everything shared with you — for flashcards that cover the same term, so you can clean up repeats.",
    target: "check-duplicates-menu-item",
    route: "/",
    moreMenu: true,
  },
  {
    id: "more-menu-share",
    title: "Share to group",
    body: "Shares every card at whatever level you're currently browsing — all of them, a whole subject, or a whole topic — into a group in one step, instead of sharing cards one at a time.",
    target: "scope-share-menu-item",
    route: "/",
    moreMenu: true,
  },
  {
    id: "search",
    title: "Search, mine vs. everywhere",
    body: "Search looks through your focus terms and descriptions. Switch \"My notes\" to \"Everywhere\" to also search cards other people have shared with you through a group.",
    target: "search-input",
    route: "/",
  },
  {
    id: "sharing",
    title: "Sharing a flashcard",
    body: "Open any flashcard and tap Share to choose which of your groups can see it. Sharing only ever grants read access — you're always the only one who can edit or delete your own cards.",
    target: null,
  },
  {
    id: "groups",
    title: "Groups",
    body: "Create a group and invite classmates by name or email. Once you're inside a group, every card shared into it shows up in a pooled feed organized the same way as your binder, with its own Quiz button too.",
    target: "create-group-button",
    route: "/groups",
  },
  {
    id: "edit-profile",
    title: "Edit profile",
    body: "Change your nickname or picture from here — upload a photo, or pick one of the built-in icons if you'd rather skip a photo.",
    target: "edit-profile-button",
    sidebarChrome: true,
  },
  {
    id: "theme",
    title: "Light & dark mode",
    body: "This switches the reading area between light and dark. The dark binder sidebar always stays the same — it's a deliberate part of the design, not a \"dark mode\" artifact.",
    target: "theme-toggle",
    sidebarChrome: true,
  },
  {
    id: "help",
    title: "You're all set",
    body: "That covers everything. Come back to this Help button anytime you want a refresher.",
    target: "help-button",
    sidebarChrome: true,
  },
];
