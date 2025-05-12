import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BadgeCheck,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
} from "lucide-react";
import { toast, useToast } from "@/hooks/use-toast";
import { motion } from "@/components/motion";
import { Progress } from "@/components/ui/progress";
import { client } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

type SentimentType = "positive" | "negative" | "neutral" | null;

const PRICE_FEED_IDS = [
  "c2289a6a43d2ce91c6f55caec370f4acc38a2ed477f58813334c6d03749ff2a4",
  "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  "55f8289be7450f1ae564dd9798e49e7d797d89adbc54fe4f8c906b1fcb94b0c3",
];

export function SentimentAnalyzer() {
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentiment, setSentiment] = useState<SentimentType>(null);
  const [confidence, setConfidence] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [analysisHistory, setAnalysisHistory] = useState<
    {
      text: string;
      sentiment: SentimentType;
      result: string;
      timestamp: Date;
    }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [latestPrices, setLatestPrices] = useState<any[]>([]);
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

  const analyzeSentiment = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setSentiment(null);
    setAnalysisResult("");
    const currentPrices = await handleGetLatestPrice();
    if (!currentPrices) {
      setAiResponse("Failed to get current price data for analysis");
      return;
    }

    try {
      const response = await client.ai.invokeAI({
        userId: userId ?? "",
        modelId: "d838273e-9c77-4ae7-b3cb-eebfb6970168",
        inputType: "Json",
        inputData: JSON.stringify({
          query: inputText,
          prices: currentPrices,
          context:
            "You are a cryptocurrency sentiment analysis tool. Determine if the sentiment is positive, negative, or neutral. Also provide a confidence score between 0-100 and a brief analysis.",
        }),
      });

      if (response.success) {
        try {
          // Parse the AI response
          const parsedResponse =
            typeof response.data.output === "string"
              ? JSON.parse(response.data.output)
              : response.data;

          // Extract content from the response
          const aiContent =
            parsedResponse.choices?.[0]?.message?.content ||
            parsedResponse.output ||
            "No analysis content available";

          // Extract sentiment and confidence from the response
          const sentimentMatch = aiContent.match(
            /sentiment:\s*(positive|negative|neutral)/i
          );
          const detectedSentiment = sentimentMatch
            ? (sentimentMatch[1].toLowerCase() as SentimentType)
            : "neutral";

          const confidenceMatch = aiContent.match(/confidence:\s*(\d+)%/i);
          const detectedConfidence = confidenceMatch
            ? parseInt(confidenceMatch[1])
            : 50;

          setSentiment(detectedSentiment);
          setConfidence(detectedConfidence);
          setAnalysisResult(aiContent);

          // Add to history
          setAnalysisHistory((prev) => [
            {
              text: inputText,
              sentiment: detectedSentiment,
              result: aiContent,
              timestamp: new Date(),
            },
            ...prev.slice(0, 4), // Keep last 5 items
          ]);

          toast({
            title: "Analysis Complete",
            description: detectedSentiment
              ? `Sentiment: ${
                  detectedSentiment.charAt(0).toUpperCase() +
                  detectedSentiment.slice(1)
                }`
              : "Sentiment: Unknown",
          });
        } catch (parseError) {
          console.error("Error parsing AI response:", parseError);
          toast({
            title: "Analysis Error",
            description: "Couldn't parse the AI response",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Analysis Failed",
          description: response.error || "AI service returned an error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Analyze Solana Sentiment</CardTitle>
          <CardDescription className="text-base">
            Enter a phrase or sentence related to Solana to analyze market
            sentiment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your Solana thoughts here..."
            className="min-h-[160px] text-base resize-none"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          {analysisResult && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Analysis:</h4>
              <p className="whitespace-pre-wrap text-sm">{analysisResult}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setInputText("");
              setSentiment(null);
              setAnalysisResult("");
            }}
            disabled={isAnalyzing}
          >
            Clear
          </Button>
          <Button
            size="lg"
            onClick={analyzeSentiment}
            disabled={isAnalyzing || !inputText.trim()}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BadgeCheck className="mr-3 h-5 w-5" />
                Analyze
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Sentiment Results</CardTitle>
          <CardDescription className="text-base">
            AI-powered analysis of Solana market sentiment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {sentiment ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center">
                {sentiment === "positive" && (
                  <ThumbsUp className="h-20 w-20 text-green-500" />
                )}
                {sentiment === "negative" && (
                  <ThumbsDown className="h-20 w-20 text-red-500" />
                )}
                {sentiment === "neutral" && (
                  <MinusCircle className="h-20 w-20 text-yellow-500" />
                )}
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-3xl font-bold">
                  {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                </h3>
                <p className="text-muted-foreground text-lg">
                  Sentiment detected
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span>Confidence</span>
                  <span className="font-medium">{confidence.toFixed(1)}%</span>
                </div>
                <Progress
                  value={confidence}
                  className={
                    sentiment === "positive"
                      ? "bg-green-200 dark:bg-green-950"
                      : sentiment === "negative"
                      ? "bg-red-200 dark:bg-red-950"
                      : "bg-yellow-200 dark:bg-yellow-950"
                  }
                />
              </div>
            </motion.div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-lg">
              Sentiment will appear here once you analyze some text.
            </div>
          )}
        </CardContent>
      </Card>

      {analysisHistory.length > 0 && (
        <Card className="lg:col-span-3">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Recent Analysis History</CardTitle>
            <CardDescription className="text-base">
              Your recent sentiment analysis results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-12 bg-muted p-4 text-base font-medium">
                <div className="col-span-5">Text</div>
                <div className="col-span-2">Sentiment</div>
                <div className="col-span-2">Confidence</div>
                <div className="col-span-3">Time</div>
              </div>

              {analysisHistory.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 p-4 text-base border-t hover:bg-muted/50 transition-colors"
                >
                  <div className="col-span-5 truncate">{item.text}</div>
                  <div className="col-span-2 flex items-center">
                    {item.sentiment === "positive" && (
                      <>
                        <ThumbsUp className="h-5 w-5 text-green-500 mr-2" />
                        <span>Positive</span>
                      </>
                    )}
                    {item.sentiment === "negative" && (
                      <>
                        <ThumbsDown className="h-5 w-5 text-red-500 mr-2" />
                        <span>Negative</span>
                      </>
                    )}
                    {item.sentiment === "neutral" && (
                      <>
                        <MinusCircle className="h-5 w-5 text-yellow-500 mr-2" />
                        <span>Neutral</span>
                      </>
                    )}
                  </div>
                  <div className="col-span-2">
                    {item.result.match(/confidence:\s*(\d+)%/i)?.[1] || "--"}%
                  </div>
                  <div className="col-span-3 text-muted-foreground">
                    {item.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
