import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Pause, Play, Send } from "lucide-react";
import { SolanaHeader } from "@/components/solana-header";
import { motion } from "@/components/motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { PriceUpdate } from "../../../../PrismonSDK/src";
import { client } from "@/lib/utils";
import PythCryptoChart from "@/components/PythDataChart";
import { SentimentAnalyzer } from "@/components/sentiment-analyzer";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

const PRICE_FEED_IDS = [
  "c2289a6a43d2ce91c6f55caec370f4acc38a2ed477f58813334c6d03749ff2a4",
  "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  "55f8289be7450f1ae564dd9798e49e7d797d89adbc54fe4f8c906b1fcb94b0c3",
];

export function Dashboard() {
  const { publicKey, disconnect } = useWallet();
  const walletAddress = publicKey?.toBase58();
  const [streamedPrices, setStreamedPrices] = useState<
    (PriceUpdate & { timestamp: string })[]
  >([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stopStream, setStopStream] = useState<(() => Promise<void>) | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [latestPrices, setLatestPrices] = useState<any[]>([]);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [userQuery, setUserQuery] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const { userId, isAuthenticated } = useAuth();

  // Clean up the price data for AI analysis
  const cleanPriceData = useCallback((prices: any[]) => {
    return prices.map((price) => ({
      id: price.id,
      symbol:
        price.id === PRICE_FEED_IDS[0]
          ? "SOL/USD"
          : price.id === PRICE_FEED_IDS[1]
          ? "BTC/USD"
          : "ETH/USD",
      currentPrice:
        parseFloat(price.price.price) * Math.pow(10, price.price.expo),
      confidence: parseFloat(price.price.conf) * Math.pow(10, price.price.expo),
      publishTime: new Date(price.price.publish_time * 1000).toLocaleString(),
      emaPrice:
        parseFloat(price.ema_price.price) * Math.pow(10, price.ema_price.expo),
      emaConfidence:
        parseFloat(price.ema_price.conf) * Math.pow(10, price.ema_price.expo),
    }));
  }, []);

  // Start/stop price streaming
  const handleStreaming = useCallback(async () => {
    if (isStreaming && stopStream) {
      try {
        setIsLoading(true);
        await stopStream();
        setIsStreaming(false);
        setStopStream(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      const stop = await client.pyth.streamPrices({
        priceFeedIds: PRICE_FEED_IDS,
        onPriceUpdate: (priceUpdate) => {
          setStreamedPrices((prev) => [
            ...prev.slice(-9),
            { ...priceUpdate, timestamp: new Date().toISOString() },
          ]);
        },
        ignoreInvalidPriceIds: true,
      });
      setStopStream(() => stop);
      setIsStreaming(true);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  }, [isStreaming, stopStream]);

  // Initialize with latest prices and start streaming
  useEffect(() => {
    const initialize = async () => {
      await handleGetLatestPrice();
      await handleStreaming();
    };
    initialize();

    return () => {
      if (stopStream) {
        stopStream().catch((err) => {
          console.error("Error stopping stream on unmount:", err);
        });
      }
    };
  }, []);

  // Fetch latest prices
  const handleGetLatestPrice = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await client.pyth.getLatestPrice({
        priceFeedIds: PRICE_FEED_IDS,
        ignoreInvalidPriceIds: true,
      });

      if (response.success && response.data) {
        const cleanedPrices = cleanPriceData(response.data.prices);
        setLatestPrices(cleanedPrices);
        setError(null);
        return cleanedPrices;
      } else {
        setError(response.error || "Failed to fetch latest prices");
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cleanPriceData]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SolanaHeader />

      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Welcome back, connected wallet:{" "}
              <span className="font-mono">
                {walletAddress &&
                  `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`}
              </span>
              {isAuthenticated ? (
                <p>Logged in as user: {userId}</p>
              ) : (
                <p>Not logged in</p>
              )}
            </p>
          </div>
          <div className="flex gap-2 mt-6 md:mt-0">
            <Button
              variant={isStreaming ? "destructive" : "default"}
              size="lg"
              onClick={handleStreaming}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : isStreaming ? (
                <>
                  <Pause className="mr-2 h-5 w-5" />
                  Stop Streaming
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start Streaming
                </>
              )}
            </Button>
            <Button variant="outline" size="lg" onClick={disconnect}>
              <LogOut className="mr-2 h-5 w-5" />
              Disconnect
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Real-time Price Data</h2>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  isStreaming ? "bg-green-500" : "bg-gray-500"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {isStreaming ? "Streaming live" : "Stream paused"}
              </span>
            </div>
          </div>
          <PythCryptoChart priceUpdates={streamedPrices} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <SentimentAnalyzer />
        </motion.div>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Solana Sentiment Tracker. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
