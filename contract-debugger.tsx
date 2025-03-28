"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, AlertTriangle, Code, RefreshCw, ExternalLink } from "lucide-react"

export default function ContractDebugger() {
  const [activeTab, setActiveTab] = useState("verify")
  const [contractAddress, setContractAddress] = useState("")
  const [contractABI, setContractABI] = useState("")
  const [verificationStatus, setVerificationStatus] = useState<null | "success" | "error" | "warning">(null)
  const [verificationDetails, setVerificationDetails] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Sample contract issues to check for
  const commonIssues = [
    {
      id: "reentrancy",
      name: "Reentrancy Vulnerability",
      description: "Check if the contract is vulnerable to reentrancy attacks",
      status: null as null | "pass" | "fail" | "warning",
    },
    {
      id: "overflow",
      name: "Integer Overflow/Underflow",
      description: "Check for potential integer overflow or underflow vulnerabilities",
      status: null as null | "pass" | "fail" | "warning",
    },
    {
      id: "randomness",
      name: "Secure Randomness",
      description: "Verify that randomness generation is secure and unpredictable",
      status: null as null | "pass" | "fail" | "warning",
    },
    {
      id: "access",
      name: "Access Control",
      description: "Check if proper access controls are implemented",
      status: null as null | "pass" | "fail" | "warning",
    },
    {
      id: "gas",
      name: "Gas Optimization",
      description: "Analyze contract for gas efficiency",
      status: null as null | "pass" | "fail" | "warning",
    },
  ]

  const [issues, setIssues] = useState(commonIssues)

  const handleVerifyContract = () => {
    if (!contractAddress) return

    setIsLoading(true)
    setVerificationStatus(null)
    setVerificationDetails([])

    // Simulate contract verification process
    setTimeout(() => {
      setIsLoading(false)

      // Simulate different verification results based on address format
      if (contractAddress.startsWith("0x") && contractAddress.length === 42) {
        setVerificationStatus("success")
        setVerificationDetails([
          "Contract successfully verified on the blockchain",
          "Compiler version: v0.8.17+commit.8df45f5f",
          "Optimization enabled: Yes with 200 runs",
          "License: MIT",
        ])

        // Set random statuses for issues
        setIssues(
          issues.map((issue) => ({
            ...issue,
            status: Math.random() > 0.7 ? "fail" : Math.random() > 0.5 ? "warning" : "pass",
          })),
        )
      } else if (contractAddress.startsWith("0x")) {
        setVerificationStatus("warning")
        setVerificationDetails([
          "Contract partially verified",
          "Warning: Contract may use deprecated features",
          "Optimization level could not be determined",
        ])

        setIssues(
          issues.map((issue) => ({
            ...issue,
            status: Math.random() > 0.5 ? "warning" : "pass",
          })),
        )
      } else {
        setVerificationStatus("error")
        setVerificationDetails([
          "Contract verification failed",
          "Invalid contract address format",
          "Address must start with '0x' and be 42 characters long",
        ])

        setIssues(
          issues.map((issue) => ({
            ...issue,
            status: null,
          })),
        )
      }
    }, 2000)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Smart Contract Debugger</h1>

      <Tabs defaultValue="verify" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="verify">Verify Contract</TabsTrigger>
          <TabsTrigger value="analyze">Security Analysis</TabsTrigger>
          <TabsTrigger value="interact">Interact</TabsTrigger>
        </TabsList>

        <TabsContent value="verify" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Verification</CardTitle>
              <CardDescription>Verify your smart contract code against the deployed bytecode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contract-address">Contract Address</Label>
                <Input
                  id="contract-address"
                  placeholder="0x..."
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="contract-abi">Contract ABI (Optional)</Label>
                <Textarea
                  id="contract-abi"
                  placeholder="[{...}]"
                  value={contractABI}
                  onChange={(e) => setContractABI(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {verificationStatus && (
                <Alert
                  variant={
                    verificationStatus === "success"
                      ? "default"
                      : verificationStatus === "warning"
                        ? "default"
                        : "destructive"
                  }
                  className={
                    verificationStatus === "success"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : verificationStatus === "warning"
                        ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        : undefined
                  }
                >
                  {verificationStatus === "success" && <CheckCircle className="h-4 w-4" />}
                  {verificationStatus === "warning" && <AlertTriangle className="h-4 w-4" />}
                  {verificationStatus === "error" && <XCircle className="h-4 w-4" />}

                  <AlertTitle>
                    {verificationStatus === "success" && "Verification Successful"}
                    {verificationStatus === "warning" && "Verification Warning"}
                    {verificationStatus === "error" && "Verification Failed"}
                  </AlertTitle>

                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {verificationDetails.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleVerifyContract} disabled={isLoading || !contractAddress} className="w-full">
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4 mr-2" />
                    Verify Contract
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Analysis</CardTitle>
              <CardDescription>Analyze your contract for common security vulnerabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{issue.name}</h3>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                      </div>

                      {issue.status === "pass" && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" /> Pass
                        </Badge>
                      )}

                      {issue.status === "fail" && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          <XCircle className="w-3 h-3 mr-1" /> Fail
                        </Badge>
                      )}

                      {issue.status === "warning" && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Warning
                        </Badge>
                      )}

                      {issue.status === null && <Badge variant="outline">Not Checked</Badge>}
                    </div>

                    {issue.status === "fail" && (
                      <div className="mt-2 p-2 bg-red-500/5 rounded text-sm">
                        <p className="font-medium text-red-500">Issue Detected:</p>
                        <p>
                          The contract may be vulnerable to {issue.name.toLowerCase()} attacks. Consider implementing
                          the recommended fixes.
                        </p>
                      </div>
                    )}

                    {issue.status === "warning" && (
                      <div className="mt-2 p-2 bg-yellow-500/5 rounded text-sm">
                        <p className="font-medium text-yellow-500">Potential Issue:</p>
                        <p>
                          Some code patterns suggest potential {issue.name.toLowerCase()} concerns. Review the
                          highlighted sections.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("verify")}>
                Back to Verification
              </Button>
              <Button
                disabled={!contractAddress || verificationStatus !== "success"}
                onClick={() => {
                  setIssues(
                    issues.map((issue) => ({
                      ...issue,
                      status: Math.random() > 0.7 ? "fail" : Math.random() > 0.5 ? "warning" : "pass",
                    })),
                  )
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-analyze
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="interact" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Interaction</CardTitle>
              <CardDescription>Call contract functions and debug responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-md text-center">
                <p className="text-muted-foreground">Contract interaction requires verification first</p>
                <Button variant="link" onClick={() => setActiveTab("verify")} className="mt-2">
                  Go to verification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Common Smart Contract Issues & Fixes</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Reentrancy:</strong> Always update state before external calls and consider using ReentrancyGuard.
          </li>
          <li>
            <strong>Integer Overflow/Underflow:</strong> Use SafeMath library or Solidity 0.8.x which has built-in
            overflow checks.
          </li>
          <li>
            <strong>Randomness:</strong> Don't rely on block.timestamp or blockhash for randomness. Consider Chainlink
            VRF.
          </li>
          <li>
            <strong>Access Control:</strong> Implement proper role-based access using OpenZeppelin's AccessControl.
          </li>
          <li>
            <strong>Gas Optimization:</strong> Use uint256 instead of smaller uints, batch operations, and minimize
            storage usage.
          </li>
          <li>
            <strong>Front-Running:</strong> Implement commit-reveal schemes or use a private mempool for sensitive
            transactions.
          </li>
          <li>
            <strong>Oracle Manipulation:</strong> Use time-weighted average prices and multiple data sources.
          </li>
        </ul>

        <div className="mt-4">
          <Button variant="outline" asChild>
            <a
              href="https://consensys.github.io/smart-contract-best-practices/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Smart Contract Best Practices
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

