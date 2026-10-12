import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { WalletView } from "@/components/account/wallet";

export const metadata: Metadata = { title: "Wallet", robots: { index: false } };

export default function Route() {
  return (
    <Page>
      <WalletView />
    </Page>
  );
}
