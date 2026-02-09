import type { NavigationMenuItem } from "@nuxt/ui";

export const useDashboardNavigation = () => {
  const organizerStore = useOrganizerStore();
  const { isOrganizer } = storeToRefs(organizerStore);

  const links = computed<NavigationMenuItem[][]>(() => {
    const baseLinks = [
      [
        {
          label: 'Dasbor',
          icon: "i-heroicons-rectangle-group",
          to: "/dashboard",
        },
        {
          label: 'Agenda',
          icon: "i-heroicons-calendar",
          to: "/dashboard/agendas",
        },
        {
          label: 'Proyek',
          icon: "i-heroicons-code-bracket",
          to: "/dashboard/projects",
        },
        {
          label: 'Pencapaian',
          icon: "i-heroicons-trophy",
          to: "/dashboard/achievements",
        },
        {
          label: 'Aspirasi',
          icon: "i-heroicons-clipboard-document-list",
          to: "/dashboard/aspirations",
        },
      ],
    ];
    if (isOrganizer.value) {
      baseLinks.push([
        {
          label: 'Anggota',
          icon: "i-heroicons-users",
          to: "/administrator/members",
        },
        {
          label: 'pengurus',
          icon: "i-heroicons-user-group",
          to: "/administrator/organizer",
        },
        {
          label: 'Manajemen Agenda',
          icon: "i-heroicons-calendar",
          to: "/administrator/agendas",
        },
        {
          label: 'Manajemen Pencapaian',
          icon: "i-heroicons-trophy",
          to: "/administrator/achievements",
        },
        {
          label: 'Berita',
          icon: "i-heroicons-clipboard-document-list",
          to: "/administrator/news",
        },
        {
          label: 'Galeri',
          icon: "i-heroicons-photo",
          to: "/administrator/photos",
        },
        {
          label: 'Tanda Tangan',
          icon: "i-heroicons-finger-print",
          to: "/signatures",
        },
        {
          label: 'Pesan',
          icon: "i-heroicons-archive-box",
          to: "/administrator/messages",
        },
        {
          label: 'Pengaturan',
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
