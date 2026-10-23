import { Link } from "@tanstack/react-router";
import { Anchor, Banknote, ShieldCheck, ShoppingBasket, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UkTopicNav() {
  return <nav aria-label="UK topic shortcuts" className="flex flex-wrap gap-2 border-y border-night-line py-4">
    <Button asChild variant="outline" size="sm"><Link to="/small-boats"><Anchor />Small boats</Link></Button>
    <Button asChild variant="outline" size="sm"><Link to="/register" search={{ category: "Cost of living" }}><ShoppingBasket />Cost of living</Link></Button>
    <Button asChild variant="outline" size="sm"><Link to="/register" search={{ category: "Finance" }}><Banknote />Debt & economy</Link></Button>
    <Button asChild variant="outline" size="sm"><Link to="/register" search={{ category: "Crime" }}><ShieldCheck />Crime</Link></Button>
    <Button asChild variant="outline" size="sm"><Link to="/register" search={{ category: "NHS & doctors" }}><Stethoscope />NHS</Link></Button>
  </nav>;
}