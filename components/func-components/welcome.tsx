import React from "react";
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {  SignInButton} from "@clerk/nextjs";
import { styled } from "styled-components";

import HomeIcon from '@/components/icons/home';
import HelpOutlineIcon from '@/components/icons/help';

import LoginIcon from '@/components/icons/login';
import { useAppContext } from '@/lib/context';
import Button from '@/components/util-components/button';

const WelcomeWrap = styled.div`
    padding-top:18px;
    padding-right:40px;
    width:100%;
    a{
        text-decoration: none;
        &:hover{
            color:var(--highlight);
        }
    }
    @media screen and (max-width: 1200px) {
        padding-right:30px;
    }
`;

const Favorites = styled.div`
    margin-left:22px;
    width:100%;
    height:40px;
    font-size:12px;
      a{
          text-decoration: none;
          &:hover{
              color: var(--highlight);
          }
      }
`;

const LeftText = styled.div`
    padding-top:28px;
    padding-right:20px;
    line-height:1.5;
    a{
        text-decoration: none;
        &:hover{
            color: var(--highlight);
        }
    }
   
`;
interface Props {
}
const Welcome: React.FC<Props> = () => {
    const router = useRouter();
    const { view, params2, tp2, noUser, mode, userId, isMobile, setLeague, setView, setPagetype,  setPlayer, setMode, fbclid, utm_content, params, tp, league, pagetype, team, player, teamName, setTeamName } = useAppContext();
    return <> <WelcomeWrap className="text-left">
        Welcome to {process.env.NEXT_PUBLIC_APP_NAME}!<br /><hr />
        {false && <span><em>That&apos;s the ticket!</em> <br /><br /><br /></span>}
        <br />The indispensable Fantasy Sports<br />
        real-time, annotated <br />
        media index.<br /><br />
        As new stories are published <br />in the media, they are sliced and diced <br />
        into annotated indexed mentions of <br />
        individual athletes and teams.<br /><br />

        Track the media mentions across <br />your fantasy teams effortlessly<br />
        using the My Fantasy Team feature<br /><br />
        <hr />
        Powered by OpenAI.</WelcomeWrap>
        <br />
        <Favorites><Button disabled={view == 'fav'} onClick={() => {
            if (view != 'faq') {
                setView("faq")
                router.push(`/?view=faq${params2}${tp2.replace('?', '&')}`);
            }
            else {
                setView("mentions")
                router.push(`/${params}${tp2.replace('?', '&')}`);
            }
        }} style={{ padding: 10 }} variant="outlined">{view == "faq" ? <HomeIcon fontSize="small" /> : <HelpOutlineIcon fontSize="small" />}&nbsp;&nbsp;{view == "faq" ? <span>Back to Home</span> : <span>Read Me</span>}</Button></Favorites>

        <LeftText><hr />Copyright &#169; 2024, Findexar, Inc.<br />Made in Minnesota. L&apos;Étoile du Nord.</LeftText>
        {noUser && <><LeftText>Click here to sign-in or sign-up: <br /><br /><br /></LeftText>
            <Favorites><SignInButton><Button style={{ padding: 10 }} size="small" variant="outlined"><LoginIcon />&nbsp;&nbsp;Sign-In</Button></SignInButton></Favorites></>}
        <LeftText><hr />Contact: @findexar on X (Twitter)<hr /></LeftText>
        <LeftText><br />League News Digests on X (Twitter):</LeftText>
        <Favorites><LeftText><Link href="https://twitter.com/qwiket_nfl">NFL Digest Twitter Feed</Link></LeftText>
            <LeftText><Link href="https://twitter.com/qwiket_nhl">NHL Digest Twitter Feed</Link></LeftText>
            <LeftText><Link href="https://twitter.com/qwiket_mlb">MLB Digest Twitter Feed</Link></LeftText>
            <LeftText><Link href="https://twitter.com/qwiket_nba">NBA Digest Twitter Feed</Link></LeftText>
        </Favorites>
    </>
}

export default Welcome;