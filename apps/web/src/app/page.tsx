import { Commands } from "@/components/commands";
import { Install } from "@/components/install";
import { Logo } from "@/components/logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  return (
    <Tabs
      defaultValue="get-started"
      className="h-screen w-screen overflow-hidden"
    >
      <div className="flex justify-between bg-[#1B1B1B]">
        <TabsList className="w-full flex justify-start rounded-none bg-[#1B1B1B]">
          <TabsTrigger value="get-started">Get Started</TabsTrigger>
          <TabsTrigger value="install">Install</TabsTrigger>
          <a href="https://github.com/midday-ai/languine">
            <button
              className="text-sm font-medium h-full px-4 text-primary"
              type="button"
            >
              GitHub
            </button>
          </a>
        </TabsList>

        <div className="ml-auto">
          <a href="https://midday.ai?utm_source=languine">
            <button
              className="text-sm font-medium h-full whitespace-nowrap px-4 opacity-50 hover:opacity-100 transition-opacity"
              type="button"
            >
              Made by midday
            </button>
          </a>
        </div>
      </div>

      <div className="p-6 mt-4 h-full overflow-y-auto pb-[100px]">
        <TabsContent value="get-started">
          <Logo />
          <div className="text-sm font-mono">
            <p>Translate your application with Languine CLI powered by AI.</p>
            <Commands />
          </div>
        </TabsContent>
        <TabsContent value="install">
          <Install />
        </TabsContent>
      </div>
    </Tabs>
  );
}
