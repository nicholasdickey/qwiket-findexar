import { headers } from "next/headers";
import { unstable_serialize } from 'swr';
import { auth, currentUser } from "@clerk/nextjs/server";
import { SWRProvider } from '@/app/swr-provider';

import fetchLeagues from '@/lib/fetchers/leagues';
import fetchSession from '@/lib/fetchers/session';
import fetchSlugStory from '@/lib/fetchers/slug-story';
import fetchMention from '@/lib/fetchers/mention';
import fetchMetaLink from '@/lib/fetchers/meta-link';
import fetchLeagueTeams from '@/lib/fetchers/league-teams';
import fetchTeamMentions from '@/lib/fetchers/team-mentions';
import fetchTeamPlayers from '@/lib/fetchers/team-players';
import fetchUserSubscription from "@/lib/fetchers/user-subscription";
import { getASlugStory } from '@/lib/fetchers/slug-story';

import { getAMention } from '@/lib/fetchers/mention';
import SPALayout from '@/components/spa';
import fetchData from '@/lib/fetchers/fetch-data';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { leagueid: string, teamid: string },
  searchParams: { [key: string]: string | string[] | undefined }
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Read route params
  let { id, story }:
    { fbclid: string, utm_content: string, view: string, tab: string, id: string, story: string } = searchParams as any;
  let findexarxid = id || "";
  let league = params.leagueid.toUpperCase();

  let amention, astory;
  if (findexarxid) {
    amention = await getAMention({ type: "AMention", findexarxid });
  }
  if (story) {
    astory = await getASlugStory({ type: "ASlugStory", slug: story });
  }

  const { summary: amentionSummary = "", league: amentionLeague = "", type = "", team: amentionTeam = "", teamName: amentionTeamName = "", name: amentionPlayer = "", image: amentionImage = "", date: amentionDate = "" } = amention || {};
  const { title: astoryTitle = "", site_name: astorySite_Name = "", authors: astoryAuthors = "", digest: astoryDigest = "", image: astoryImage = "", createdTime: astoryDate = "", mentions: mentions = [], image_width = 0, image_height = 0 } = astory || {};
  const astoryImageOgUrl = astoryImage ? `${process.env.NEXT_PUBLIC_SERVER}/api/og.png/${encodeURIComponent(astoryImage)}/${encodeURIComponent(astorySite_Name)}/${image_width}/${image_height}` : ``;

  // Prepare meta data for amention
  let ogUrl = '';
  if (amention && amentionLeague && amentionTeam && amentionPlayer) {
    ogUrl = `${process.env.NEXT_PUBLIC_SERVER}/${amentionLeague}/${amentionTeam}/${amentionPlayer}?id=${findexarxid}`;
  } else if (amention && amentionLeague && amentionTeam) {
    ogUrl = `${process.env.NEXT_PUBLIC_SERVER}/${amentionLeague}/${amentionTeam}?id=${findexarxid}`;
  } else if (amention && amentionLeague) {
    ogUrl = `${process.env.NEXT_PUBLIC_SERVER}/${amentionLeague}?id=${findexarxid}`;
  } else if (amention) {
    ogUrl = `${process.env.NEXT_PUBLIC_SERVER}/?id=${findexarxid}`;
  } else {
    ogUrl = `${process.env.NEXT_PUBLIC_SERVER}`;
  }

  let ogTarget = '';
  if (amention && amentionLeague && amentionTeam && amentionPlayer && type == 'person') {
    ogTarget = `${amentionPlayer} of ${amentionTeamName}`;
  } else if (amention && amentionLeague && amentionTeam) {
    ogTarget = `${amentionTeamName} on ${process.env.NEXT_PUBLIC_APP_NAME}`;
  }

  let ogDescription = amentionSummary ? amentionSummary : "Fantasy Sports Media Reader and Mentions Index.";
  let ogImage = astoryImageOgUrl ? astoryImageOgUrl : process.env.NEXT_PUBLIC_APP_NAME == "Findexar" ? "https://findexar.com/findexar-logo.png" : "https://www.qwiket.com/QLogo.png";
  let ogTitle = ogTarget ? `${ogTarget}` : `${process.env.NEXT_PUBLIC_APP_NAME} Sports Media Reader`;
  if (astory) {
    ogUrl = league ? `${process.env.NEXT_PUBLIC_SERVER}/${league}?${story ? `story=${story}` : ``}` : `${process.env.NEXT_PUBLIC_SERVER}/?${story ? `story=${story}` : ``}`;
    ogTitle = astoryTitle;
    ogDescription = astoryDigest.replaceAll('<p>', '').replaceAll('</p>', "\n\n");
    ogImage = astoryImageOgUrl;
  }
  const noindex = 1;

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
    robots: noindex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: ogUrl,
    },
    icons: {
      icon: process.env.NEXT_PUBLIC_APP_NAME == "Findexar" ? "/FiLogo.png" : "/QLogo.png",
      shortcut: process.env.NEXT_PUBLIC_APP_NAME == "Findexar" ? "/FiLogo.png" : "/QLogo.png",
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { leagueid: string, teamid: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const t1 = new Date().getTime();

  let { userId } = auth();
  if (!userId) {
    userId = "";
  }
  let sessionid = "";
  let dark = 0;
  try {
    const session = await fetchSession();
    sessionid = session.sessionid;
    dark = session.dark;
  } catch (x) {
    console.log("error fetching sessionid", x);
  }

  let fallback: { [key: string]: any } = {};
  const leaguesKey = { type: "leagues" };

  fallback[unstable_serialize(leaguesKey)] = fetchLeagues(leaguesKey);

  let headerslist = headers();
  let { tab, fbclid, utm_content, view = "mentions", id, story }:
    { fbclid: string, utm_content: string, view: string, tab: string, id: string, story: string } = searchParams as any;
  let findexarxid = id || "";
  let pagetype = "team";
  let league = params.leagueid.toUpperCase();
  let teamid = params.teamid;
  console.log("league->", league);
  utm_content = utm_content || '';
  fbclid = fbclid || '';
  const ua = headerslist.get('user-agent') || "";

  let isMobile = Boolean(ua.match(
    /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
  ));
  view = view.toLowerCase();
  if (view == 'feed') {
    view = 'mentions';
  }
  console.log("VIEW:", view, isMobile);
  if (view == 'home') {
    view = 'mentions';
  }
  let calls: { key: any, call: Promise<any> }[] = [];

  calls.push(await fetchLeagueTeams({ league }));
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

  if (view == 'mentions' && tab != 'myteam' && tab != 'fav') {
    if (!story && !findexarxid) {
      calls.push(await fetchTeamMentions({ userId, sessionid, league, teamid }));
    }
  }
  if (!story && !findexarxid) {
    calls.push(await fetchTeamPlayers({ userId, sessionid, teamid }));
  }
  await fetchData(t1, fallback, calls);
  const key = { type: "league-teams", league };
  let teams = fallback[unstable_serialize(key)];
  let teamName = teams?.find((x: any) => x.id == teamid)?.name;
  return (
    <SWRProvider value={{ fallback }}>
      <main className="w-full h-full">
        <SPALayout dark={dark} view={view} tab={tab} fallback={fallback} fbclid={fbclid} utm_content={utm_content} isMobile={isMobile} story={story} findexarxid={findexarxid} league={league} teamid={teamid} pagetype={pagetype} teamName={teamName} />
      </main>
    </SWRProvider>
  );
}
