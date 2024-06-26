'use client'
import React, { useCallback, useEffect, useState } from "react";
import Link from 'next/link';

import useSWR from "swr";
import { LeaguesKey, UserSubscriptionKey as SubscriptionKey } from '@/lib/keys';
import fetchLeagues from '@/lib/fetchers/leagues';

import { styled } from "styled-components";
import { Tabs, Tab } from '@/components/nav-components/tabs';
import Avatar from '@/components/util-components/avatar';
import IconButton from '@/components/util-components/icon-button';
import HomeIcon from '@/components/icons/home';
import LoginIcon from '@/components/icons/login';
import ModeNightTwoToneIcon from '@/components/icons/moon';
import LightModeTwoToneIcon from '@/components/icons/sun';
import StarOutlineIcon from '@/components/icons/star-outline';
import StarIcon from '@/components/icons/star';
import { UserButton, SignInButton, SignedOut, SignedIn } from "@clerk/nextjs";
import { useAppContext } from '@/lib/context';
import { actionRecordEvent as recordEvent } from "@/lib/actions";
import PlayerPhoto from "@/components/util-components/player-photo";
import saveSession from '@/lib/fetchers/save-session';
import {actionUserSubscription} from '@/lib/fetchers/user-subscription';

interface HeaderProps {
  $scrolled: boolean;
}

const Header = styled.header<HeaderProps>`
  height: ${({ $scrolled }) => $scrolled ? 80 : 100}px;
  width: 100%;
  min-width: 1vw;
  background-color: var(--header-bg);
  text-align: center;
  font-size: 40px;
  padding-bottom: 10px;
  font-family: 'Roboto', sans-serif;
  transition: height 0.2s ease, padding-top 0.2s ease;
  a {
    color: var(--header-title-color);
    text-decoration: none;
    &:hover {
      color: var(--highlight);
    }  
  }
  @media screen and (max-width: 1024px) {
    height: 68px;
    background-color: var(--mobile-header-bg);
    a {
      color: var(--mobile-header-title-color);  
    }
    position: -webkit-sticky; /* Safari */
    position: sticky;
    top: 0;
    z-index: 10;
    padding-bottom: 6px;
  }
  position: sticky;
  top: 0px;
  z-index: 10;
`;

const ContainerWrap = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  color: var(--text);
  @media screen and (max-width: 1024px) {
    display: none;
  }
  @media screen and (min-width: 1600px) {
    font-size: 18px;
  }
  @media screen and (min-width: 1800px) {
    font-size: 19px;
  }
  @media screen and (min-width: 2000px) {
    font-size: 20px;
  }
`;

const MobileContainerWrap = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  color: #111;
  font-family: 'Roboto', sans-serif;
  border-top: 1px solid #ccc;
  @media screen and (min-width: 1025px) {
    display: none;
  }
`;

const League = styled.div<HeaderProps>`
  height: ${({ $scrolled }) => $scrolled ? 16 : 26}px;
  width: 100px; 
  color: var(--leagues-text);
  text-align: center;
  margin: 0px;
  padding-top: ${({ $scrolled }) => $scrolled ? 0 : 3}px;
  margin-bottom: ${({ $scrolled }) => $scrolled ? 2 : 6}px;
  @media screen and (max-width: 1024px) {
    height: 24px;
  }
`;

const SelectedLeague = styled.div<HeaderProps>`
  height: ${({ $scrolled }) => $scrolled ? 16 : 26}px;
  width: 100px;
  color: var(--leagues-selected);
  text-align: center;
  margin: 0px;
  padding-top: ${({ $scrolled }) => $scrolled ? 0 : 3}px;
  margin-bottom: ${({ $scrolled }) => $scrolled ? 2 : 6}px;
  a {
    color: var(--leagues-selected) !important;
    text-decoration: none;
    &:hover {
      color: var(--leagues-highlight);
    }
  }
  @media screen and (max-width: 1024px) {
    height: 24px;
  }
`;

const SelectedHome = styled.div<HeaderProps>`
  color: var(--leagues-selected);   
  a {
    color: var(--leagues-selected) !important;
    text-decoration: none;
    &:hover {
      color: var(--leagues-highlight);
    }
  }
`;

const Leagues = styled.div<HeaderProps>`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-evenly;
  align-items: center;
  height: ${({ $scrolled }) => $scrolled ? 21 : 32}px;
  padding-bottom: 0px;
  width: 100%;
  background-color: var(--leagues-bg);
  color: #aaa;
  text-align: center;
  font-size: ${({ $scrolled }) => $scrolled ? 14 : 17}px;
  margin: 0px;
  a {
    color: var(--leagues-text);
    text-decoration: none;
    &:hover {
      color: var(--leagues-highlight);
    } 
  }
  @media screen and (max-width: 1024px) {
    font-size: 17px;
  }
`;

const LeagueIcon = styled.div<HeaderProps>``;

const MuiTabs = styled(Tabs)`
  width: 100%;
  color: var(--mobile-leagues-text);
  background-color: var(--mobile-leagues-bg);
`;

const Superhead = styled.div<HeaderProps>`
  font-size: ${({ $scrolled }) => $scrolled ? 24 : 32}px !important;
  margin-top: 4px;
  text-align: left;
  color: var(--header-title-color);
  font-size: 18px;
  transition: font-size 0.2s ease;
  @media screen and (max-width: 1024px) {
    display: none;
  }
`;

const SuperheadMobile = styled.div`
  font-size: 17px;
  margin-top: 4px;
  text-align: left;
  color: var(--mobile-header-title-color); 
  @media screen and (min-width: 1025px) {
    display: none;
  }
`;

const Subhead = styled.div<HeaderProps>`
  font-size: ${({ $scrolled }) => $scrolled ? 12 : 16}px;
  margin-bottom: 8px;
  text-align: left;
  color: var(--subheader-color);
  transition: font-size 0.2s ease;
  @media screen and (max-width: 1024px) {
    display: none;
  }
`;

const SubheadMobile = styled.div`
  margin-top: 4px;
  text-align: left;
  color: var(--mobile-subheader-color);    
  font-size: 14px;
  @media screen and (min-width: 1025px) {
    display: none;
  }
`;

const HeaderTopline = styled.div`
  display: flex;
  height: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  color: var(--header-title-color);
  @media screen and (max-width: 1024px) {
    font-size: 20px;
    margin-bottom: 0px;
    color: var(--mobile-header-title-color); 
  }
`;

const LeftContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-left: 20px;
  @media screen and (max-width: 1024px) {
    margin-left: 0px;
    margin-right: 0px;
  }
`;

const ContainerCenter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
`;

const HeaderCenter = styled.div`
  margin-left: 60px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  @media screen and (max-width: 1024px) {
    margin-left: 0px;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-right: 30px;
  width: 80px;
  @media screen and (max-width: 1024px) {
    margin-left: 0px;
    margin-right: 16px;
    width: 80px;   
  }
`;

const Photo = styled.div`
  height: 60px;
  width: 60px;
  @media screen and (max-width: 1024px) {
    height: 40px;
    width: 40px;
    margin-left: 10px;
  }
`;

const FLogo = styled.div`
  margin-left: 20px;
  margin-right: 20px;
  @media screen and (max-width: 1024px) {
    display: none;
  }
`;

const FLogoMobile = styled.div`
  margin-left: 10px;
  margin-right: 20px;
  @media screen and (min-width: 1025px) {
    display: none;
  }
`;

const SUserButton = styled(UserButton)``;

const PlayerNameGroup = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  font-size: 28px;
  margin-right: 20px;
  @media screen and (max-width: 1024px) {
    font-size: 14px;
    margin-right: 0px;
  }
`;

const PlayerName = styled.div`
  text-align: left;
`;

const Wiggly = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  svg {
    width: 100%;
    height: 100%;
  }
`;

interface LeaguesNavProps {
  selected: boolean;
}

const LeaguesTab = styled(Tab) <LeaguesNavProps>`
  color: ${({ selected }) => selected ? 'var(--mobile-leagues-selected)' : 'var(--mobile-leagues-text)'} !important;
  :hover {
    color: var(--mobile-leagues-highlight) !important;
  }
`;

interface Props {
}

let s = false;

const HeaderNav: React.FC<Props> = ({ }) => {
  const { fallback, mode, userId, setLeague, view, setView, setTab, setPagetype, setTeamid, setPlayer, setMode, fbclid, utm_content, params, tp, league, pagetype, teamid, player, teamName } = useAppContext();
  const leaguesKey = { type: "leagues" };
  const key: LeaguesKey = { type: "leagues" };
  const { data: leagues = [], error } = useSWR(key, fetchLeagues, {fallback });

  // Ensure that 'subscriptionKey' and 'fetchSubscription' are defined and used correctly
  const subscriptionKey: SubscriptionKey = { type: "subscription" };
  const { data: subscription, error: subscriptionError } = useSWR(subscriptionKey, actionUserSubscription, { fallback });
  const subscrLevel=subscription?.subscrLevel||0;
  console.log("subscrLevel",subscrLevel);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const onLeagueNavClick = useCallback((l: string, url: string) => {
    console.log("onLeagueNavClick", l, url, 'params:', params, 'tp:', tp);
    setLeague(l);
    setPagetype('league');
    if (view == 'teams') {
      setView('mentions');
      setTab('');
    }
    setTeamid("");
    // console.log("replaceState", url);
    window.history.pushState({}, "", url);
    setTimeout(async () =>
      await recordEvent(
        'league-nav',
        `{"fbclid":"${fbclid}","utm_content":"${utm_content}","league":"${l}"}`
      ), 0);
  }, [fbclid, utm_content]);

  useEffect(() => {
    const listener = () => {
      setScrollY(window.scrollY);
      if (window.scrollY > 0) {
        if (!scrolled && !s) {
          try {
            s = true;
            setScrolled(true);
            recordEvent(`header-scrolled`, `{"league":"${league}","teamid":"${teamid}","player":"${player}","fbclid":"${fbclid}", "utm_content":"${utm_content}"}`)
              .then((r: any) => {
                //console.log("recordEvent", r);
              });
          } catch (x) {
            console.log('recordEvent', x);
          }
        }
        setScrolled(true);
      }
    }
    function throttle(callbackFn: any, limit: number) {
      let wait = false;
      return function () {
        if (!wait) {
          callbackFn.call();
          wait = true;
          setTimeout(function () {
            wait = false;
            callbackFn.call();
          }, limit);
        }
      }
    }
    window.addEventListener("scroll", throttle(listener, 200));
    return () => window.removeEventListener("scroll", listener);
  }, [fbclid, utm_content, scrolled]);

  const updateMode = useCallback(async (mode: string) => {
    setMode(mode);
    await saveSession({ dark: mode == 'dark' ? 1 : 0 })
  }, []);

  const LeaguesNav = leagues?.map((l: string, i: number) => {
    return l == league ? <SelectedLeague $scrolled={scrollY != 0} key={`league-${l}`} ><Link href={`/${l}${params}${tp}`} onClick={() => { onLeagueNavClick(l, `/${l}${params}${tp}`) }} >{l}</Link></SelectedLeague> : <League $scrolled={scrollY != 0} key={`league-${i}`}><Link href={`/${l}${params}${tp}`} onClick={async () => { await onLeagueNavClick(l, `/${l}${params}${tp}`) }} >{l}</Link></League>
  });

  const MobileLeaguesNav = leagues?.map((l: string, i: number) => {
    return <LeaguesTab selected={l == league} key={`league-${l}`} label={l} onClick={() => { onLeagueNavClick(l, `/${l}${params}${tp}`) }} />
  })
  MobileLeaguesNav.unshift(<LeaguesTab selected={!league} key={`league-${leagues?.length}`} label={<HomeIcon className={!league ? " text-xl h-5 p-0 ml-4 " : "  text-xl h-5 p-0 ml-4 "} />} onClick={() => { onLeagueNavClick('', `/${params}${tp}`) }}></LeaguesTab>)
  LeaguesNav?.unshift(league ? <div key={`league-home`}><Link href={`/${params}${tp}`} onClick={() => { onLeagueNavClick('', `/${params}${tp}`) }}><LeagueIcon $scrolled={scrollY != 0} ><HomeIcon className={(scrollY != 0 ? `text-sm ` : `text-xl`)} /></LeagueIcon></Link></div>
    : <SelectedHome $scrolled={scrollY != 0} key={`league-home`}><Link href={`/${params}${tp}`} onClick={() => { onLeagueNavClick('', `/${params}${tp}`) }}><LeagueIcon $scrolled={scrollY != 0}><HomeIcon className={(scrollY != 0 ? `text-sm` : `text-xl`)} /></LeagueIcon></Link></SelectedHome>)
  const selectedLeague = leagues?.findIndex((l: string) => l == league) + 1;
  if (error) return <div>failed to load leagues</div>
  if (!leagues) return <div>loading leagues...</div>
  return (
    <>
      <Header $scrolled={scrollY != 0}>
        <HeaderTopline>
          <LeftContainer>
            <HeaderLeft>
              <FLogo><Link href={`/${params}`}><Avatar size={scrollY != 0 ? "medium" : "large"} className={scrollY != 0 ? "text-white bg-cyan-800 text-2xl" : "text-white bg-cyan-800 text-4xl"}>{process.env.NEXT_PUBLIC_APP_NAME == 'Findexar' ? "Fi" : "Q"}</Avatar></Link></FLogo>
              <FLogoMobile ><Link href={`/${params}`}><Avatar className="text-white bg-cyan-800">{process.env.NEXT_PUBLIC_APP_NAME == 'Findexar' ? "Fi" : "Q"}</Avatar></Link></FLogoMobile>
            </HeaderLeft>
            <ContainerCenter>
              <HeaderCenter>
                <Superhead $scrolled={scrollY != 0}>{(pagetype == "league" || pagetype == "landing") ? <Link href={`/${params}`}>{process.env.NEXT_PUBLIC_APP_NAME?.toUpperCase() + (league ? ` : ${league}` : ``)}</Link> : !teamid ? `${league}` : player ? <PlayerNameGroup><PlayerName><Link href={`/${league}/${teamid}${params}`}>{teamName}</Link></PlayerName> </PlayerNameGroup> : `${league} : ${teamName}`}</Superhead>
                <SuperheadMobile>{(pagetype == "league" || pagetype == "landing") ? <Link href={`/${params}`}>{league ? ` ${league}` : `${process.env.NEXT_PUBLIC_APP_NAME?.toUpperCase()}`}</Link> : !teamid ? `${league}` : player ? <PlayerNameGroup><PlayerName><Link href={`${league}/${teamid}${params}`}>{teamName}</Link></PlayerName> </PlayerNameGroup> : `${league} : ${teamName}`}</SuperheadMobile>
                {(pagetype == "league" || pagetype == "landing") && <div><Subhead $scrolled={scrollY != 0}>Sports Media Reader</Subhead><SubheadMobile>Sports Media Reader</SubheadMobile></div>}
                {pagetype == "player" && player && <div><Subhead $scrolled={scrollY != 0}>{player ? player : ''}</Subhead><SubheadMobile>{player ? player : ''}</SubheadMobile></div>}
              </HeaderCenter>
              {pagetype == "player" && player && <Photo><PlayerPhoto teamid={teamid || ""} name={player || ""} /></Photo>}
            </ContainerCenter>
          </LeftContainer>
          {(pagetype == "league" || pagetype == "landing" || pagetype == "team" || pagetype == "player") && <Wiggly className="hidden md:block">
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 800 400"><path d="M80.53811645507812,226.90582275390625C107.14499155680339,211.95814005533853,186.8161366780599,134.23018900553384,240.1793670654297,137.2197265625C293.5425974527995,140.20926411946616,353.1838658650716,243.64723205566406,400.7174987792969,244.84304809570312C448.25113169352215,246.0388641357422,490.5530649820964,150.07474263509116,525.3811645507812,144.39462280273438C560.2092641194662,138.7145029703776,580.9865417480469,206.5769780476888,609.6860961914062,210.7623291015625C638.3856506347656,214.9476801554362,673.6622009277344,172.49626668294272,697.5784912109375,169.50672912597656C721.4947814941406,166.5171915690104,743.9162801106771,188.93870798746744,753.183837890625,192.82510375976562" fill="none" strokeWidth="9" stroke="url(&quot;#SvgjsLinearGradient1005&quot;)" strokeLinecap="round"></path><defs><linearGradient id="SvgjsLinearGradient1005"><stop stopColor="hsl(37, 99%, 67%)" offset="0"></stop><stop stopColor="hsl(316, 73%, 52%)" offset="1"></stop></linearGradient></defs></svg>
          </Wiggly>}
          <HeaderRight>  <IconButton onClick={async () => {
            await updateMode(mode == "light" ? "dark" : "light");
          }}>
            {mode == "dark" ? <LightModeTwoToneIcon fontSize="small" /> : <ModeNightTwoToneIcon fontSize="small" />}
          </IconButton>
          <SignedIn>
          <IconButton onClick={async () => {
            await updateMode(mode == "light" ? "dark" : "light");
          }}>
            {subscrLevel == 0 ? <div className="text-white-100"><StarOutlineIcon fontSize="small" /></div> : subscrLevel == 1 ?<div className="text-white-500"><StarIcon fontSize="small" /></div>:subscrLevel == 2 ?<div className="text-amber-600"><StarIcon fontSize="small" /></div>:<div className="text-emerald-700"><StarIcon fontSize="small" /></div>}
          </IconButton>
          </SignedIn>
            <SignedIn><SUserButton afterSignOutUrl="/" /></SignedIn>
            <SignedOut><SignInButton><IconButton ><LoginIcon fontSize="small" /></IconButton></SignInButton></SignedOut>
          </HeaderRight>
        </HeaderTopline>
        <div className="hidden lg:block ">
          <ContainerWrap> <Leagues $scrolled={scrollY != 0}>
            {LeaguesNav}
          </Leagues>
          </ContainerWrap></div>
      </Header>
      <div className="block lg:hidden"><MobileContainerWrap>
        <MuiTabs
          value={selectedLeague}
          id="tabs1"
          variant="scrollable"
          scrollButtons={true}
          allowScrollButtonsMobile
          aria-label="scrollable auto tabs example"
        >
          {MobileLeaguesNav}
        </MuiTabs>
      </MobileContainerWrap>
      </div>
    </>
  )
}
export default HeaderNav;
