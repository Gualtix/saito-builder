import type { StructureResolver } from 'sanity/structure';

/** Groups content by site so each tenant's editors work in their own area. */
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Pages by site')
        .child(async () => {
          const sites: string[] = await context.getClient({ apiVersion: '2025-01-01' }).fetch('array::unique(*[_type in ["page", "siteSettings"]].site)');
          return S.list()
            .title('Sites')
            .items(
              sites.sort().map((site) =>
                S.listItem()
                  .title(site)
                  .child(
                    S.list()
                      .title(site)
                      .items([
                        S.listItem()
                          .title('Settings')
                          .child(S.documentList().title('Settings').filter('_type == "siteSettings" && site == $site').params({ site })),
                        S.listItem()
                          .title('Pages')
                          .child(S.documentList().title('Pages').filter('_type == "page" && site == $site').params({ site })),
                      ]),
                  ),
              ),
            );
        }),
      S.divider(),
      S.documentTypeListItem('page').title('All pages'),
      S.documentTypeListItem('siteSettings').title('All site settings'),
    ]);
