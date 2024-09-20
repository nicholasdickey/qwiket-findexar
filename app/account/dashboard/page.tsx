import { cookies, headers } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { SWRProvider } from '@/app/swr-provider';
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserAccountKey } from "@/lib/keys";
import fetchData from '@/lib/fetchers/fetch-data';
import promiseUser from "@/lib/fetchers/account";
import Dashboard from '@/components/func-components/account/dashboard';
import SPALayout from '@/components/spa';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Account Dashboard',
    description: 'View your account usage and information',
};

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
    let headerslist = headers();
    let { tab = "", fbclid, utm_content, view = "mentions", id, story } = searchParams as any;

    let findexarxid = id || "";
    let pagetype = "account-dashboard";
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
    let calls: { key: any; call: Promise<any> }[] = [];
    let userInfo: any;
    if (userId) {
        const user = await currentUser();
        const email = user?.emailAddresses[0]?.emailAddress || "";
        userInfo = JSON.parse(JSON.stringify(user));
        calls.push(await promiseUser({ type: "user-account", email: userInfo.email }, userId, sessionid));
    }

    if (!userInfo) {
        userInfo = { email: "" };
    }

    await fetchData(t1, fallback, calls);

    return (
        <SWRProvider value={{ fallback }}>
            <main className="w-full h-full">
                <SPALayout dark={dark || 0} view={view} tab={tab} fbclid={fbclid} utm_content={utm_content} fallback={fallback} isMobile={isMobile} league="" story={story} findexarxid={findexarxid} pagetype={pagetype} userInfo={userInfo} />
            </main>
        </SWRProvider>
    );
}