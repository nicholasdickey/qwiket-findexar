import { cookies, headers } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { unstable_serialize } from 'swr';
import { SWRProvider } from '@/app/swr-provider';
import { auth, currentUser } from "@clerk/nextjs/server";
import fetchMyTeam from '@/lib/fetchers/my-team-actions';
import fetchMyFeed from '@/lib/fetchers/myfeed';
import fetchLeagues from '@/lib/fetchers/leagues';
import fetchFavorites from '@/lib/fetchers/favorites';
import fetchSlugStory from '@/lib/fetchers/slug-story';
import fetchMention from '@/lib/fetchers/mention';
import fetchMetaLink from '@/lib/fetchers/meta-link';
import fetchStories from '@/lib/fetchers/stories';
import fetchUserSubscription from "@/lib/fetchers/user-subscription";
import { getASlugStory } from '@/lib/fetchers/slug-story';
import { getAMention } from '@/lib/fetchers/mention';

import SPALayout from '@/components/spa';
import fetchData from '@/lib/fetchers/fetch-data';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: {};
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  let { id, story } = searchParams as any;
  let findexarxid = id || "";
  const league = '';

  let amention, astory;
  if (findexarxid) {
    amention = await getAMention({ type: "AMention", findexarxid });
  }
  if (story) {
    astory = await getASlugStory({ type: "ASlugStory", slug: story });
  }

  const {
    summary: amentionSummary = "",
    league: amentionLeague = "",
    type = "",
    team: amentionTeam = "",
    teamName: amentionTeamName = "",
    name: amentionPlayer = "",
    image: amentionImage = "",
    date: amentionDate = ""
  } = amention || {};

  const {
    title: astoryTitle = "",
    site_name: astorySite_Name = "",
    authors: astoryAuthors = "",
    digest: astoryDigest = "",
    image: astoryImage = "",
    createdTime: astoryDate = "",
    mentions = [],
    image_width = 0,
    image_height = 0
  } = astory || {};

  const astoryImageOgUrl = astoryImage ? `${process.env.NEXT_PUBLIC_SERVER}/api/og.png/${encodeURIComponent(astoryImage)}/${encodeURIComponent(astorySite_Name)}/${image_width}/${image_height}` : ``;

  let ogUrl = '';
  if (amention) {
    ogUrl = `${process.env.NEXT_PUBLIC_SERVER}/${amentionLeague}/${amentionTeam}/${amentionPlayer}?id=${findexarxid}`;
  } else {
    ogUrl = `${process.env.NEXT_PUBLIC_SERVER}`;
  }

  let ogTarget = '';
  if (amention && type == 'person') {
    ogTarget = `${amentionPlayer} of ${amentionTeamName}`;
  } else if (amention) {
    ogTarget = `${amentionTeamName} on ${process.env.NEXT_PUBLIC_APP_NAME}`;
  }

  let ogDescription = amentionSummary || "Fantasy Sports Media Reader and Mentions Index.";
  let ogImage = astoryImageOgUrl || "https://www.qwiket.com/QLogo.png";
  let ogTitle = ogTarget || `${process.env.NEXT_PUBLIC_APP_NAME} Sports Media Reader`;

  if (astory) {
    ogUrl = league ? `${process.env.NEXT_PUBLIC_SERVER}/${league}?${story ? `story=${story}` : ``}` : `${process.env.NEXT_PUBLIC_SERVER}/?${story ? `story=${story}` : ``}`;
    ogTitle = astoryTitle;
    ogDescription = astoryDigest.replaceAll('<p>', '').replaceAll('</p>', "\n\n");
    ogImage = astoryImageOgUrl;
  }

  let noindex = +(process.env.NEXT_PUBLIC_NOINDEX || "0");

  return {
    title: ogTitle,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: ogUrl,
      images: [
        {
          url: ogImage,
          width: image_width,
          height: image_height,
          alt: ogTitle,
        }
      ],
      type: 'website'
    },
    robots: noindex === 1 ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: ogUrl,
    },
    icons: {
      icon: "/QLogo.png",
      shortcut: "/QLogo.png",
    },
  };
}

export default async function Page({ searchParams }: { params: { slug: string }; searchParams: { [key: string]: string | string[] | undefined } }) {
  const fetchSession = async () => {
    "use server";
    let session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.sessionid) {
      var randomstring = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      session.sessionid = randomstring();
      session.dark = -1;
    }
    return session;
  };

  const t1 = new Date().getTime();

  let sessionid = "";
  let dark = 0;
  let { userId } = auth();

  if (!userId) {
    userId = "";
  }
  console.log("*** *** *** userId", userId);
  try {
    const session = await fetchSession();
    console.log("*** *** *** session", session);
    sessionid = session.sessionid;
    dark = session.dark;
  } catch (x) {
    console.log("error fetching sessionid", x);
  }
  console.log("sessionid", sessionid);

  let fallback: { [key: string]: any } = {};
  const leaguesKey = { type: "leagues" };
  fallback[unstable_serialize(leaguesKey)] = fetchLeagues(leaguesKey);

  let headerslist = headers();
  let { tab = "", fbclid, utm_content, view = "mentions", id, story } = searchParams as any;

  let findexarxid = id || "";
  let pagetype = "league";
  let league = "";
  utm_content = utm_content || '';
  fbclid = fbclid || '';
  const ua = headerslist.get('user-agent') || "";

  let isMobile = Boolean(ua.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i));
  view = view.toLowerCase();
  if (view == 'feed') {
    view = 'mentions';
  }
  console.log("VIEW:", view, isMobile);
  if (view == 'home') {
    view = 'mentions';
  }
  let calls: { key: any; call: Promise<any> }[] = [];
  if (userId) {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    calls.push(await fetchUserSubscription({ type:"UserSubscription"}, userId, email || "" ));

  }
  if (findexarxid) {
    calls.push(await fetchMention({ type: "AMention", findexarxid }));
    calls.push(await fetchMetaLink({ func: "meta", findexarxid, long: 1 }));
  }
  if (story) {
    calls.push(await fetchSlugStory({ type: "ASlugStory", slug: story }));
  }
  if (tab == 'fav' && view == 'mentions') {
    if (!story && !findexarxid) {
      calls.push(await fetchFavorites({ userId, sessionid: sessionid || '', league, page: 0 }));
    }
  }
  if (view == 'my fantasy team' || view == 'mentions') {
    if (!story && !findexarxid) {
      calls.push(await fetchMyTeam({ userId, sessionid: sessionid || '', league }));
    }
  }
  if (tab == 'myfeed' || view == 'mentions') {
    if (!story && !findexarxid) {
      calls.push(await fetchMyFeed({ userId, sessionid, league }));
    }
  }

  if (view == 'mentions' && tab != 'myfeed' && tab != 'fav') {
    if (!story && !findexarxid) {
      calls.push(await fetchStories({ userId, sessionid, league }));
    }
  }
  await fetchData(t1, fallback, calls);

  return (
    <SWRProvider value={{ fallback }}>
      <main className="w-full h-full">
        <SPALayout dark={dark || 0} view={view} tab={tab} fallback={fallback} fbclid={fbclid} utm_content={utm_content} isMobile={isMobile} league="" story={story} findexarxid={findexarxid} pagetype={pagetype} />
      </main>
    </SWRProvider>
  );
}
