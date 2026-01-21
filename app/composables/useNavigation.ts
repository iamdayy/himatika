import type { NavigationMenuItem } from "@nuxt/ui";

export const useDashboardNavigation = () => {
  const { $ts } = useNuxtApp(); // Asumsi $ts tersedia global atau import useI18n
  const organizerStore = useOrganizerStore();
  const { isOrganizer } = storeToRefs(organizerStore);
  const { data: user } = useAuth(); // Ambil user untuk nama di menu

  const links = computed<NavigationMenuItem[][]>(() => {
    const baseLinks = [
      [
        {
          label: $ts("dashboard"),
          icon: "i-heroicons-rectangle-group",
          to: "/dashboard",
        },
        {
          label: $ts("agenda"),
          icon: "i-heroicons-calendar",
          to: "/dashboard/agendas",
        },
        {
          label: $ts("project"),
          icon: "i-heroicons-code-bracket",
          to: "/dashboard/projects",
        },
        {
          label: $ts("achievement"),
          icon: "i-heroicons-trophy",
          to: "/dashboard/achievements",
        },
        {
          label: $ts("aspiration"),
          icon: "i-heroicons-clipboard-document-list",
          to: "/dashboard/aspirations",
        },
      ],
    ];
    if (isOrganizer.value) {
      baseLinks.push([
        {
          label: $ts("member"),
          icon: "i-heroicons-users",
          to: "/administrator/members",
        },
        {
          label: $ts("organizer"),
          icon: "i-heroicons-user-group",
          to: "/administrator/organizer",
        },
        {
          label: $ts("agenda-management"),
          icon: "i-heroicons-calendar",
          to: "/administrator/agendas",
        },
        {
          label: $ts("achievement-management"),
          icon: "i-heroicons-trophy",
          to: "/administrator/achievements",
        },
        {
          label: $ts("news"),
          icon: "i-heroicons-clipboard-document-list",
          to: "/administrator/news",
        },
        {
          label: $ts("gallery"),
          icon: "i-heroicons-photo",
          to: "/administrator/photos",
        },
        {
          label: $ts("signature"),
          icon: "i-heroicons-finger-print",
          to: "/signatures",
        },
        {
          label: $ts("message"),
          icon: "i-heroicons-archive-box",
          to: "/administrator/messages",
        },
        {
          label: $ts("config"),
          icon: "i-heroicons-cog",
          to: "/administrator/config",
        },
        {
          label: "Audit Logs",
          icon: "i-heroicons-clipboard-document-check",
          to: "/dashboard/audit",
        },
      ]);
    }
    return baseLinks;
  });

  return { links };
};
