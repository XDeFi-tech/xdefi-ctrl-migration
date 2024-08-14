import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import axios from "axios";
import {
  supportedTokens,
  getBalances,
  permitMigration,
  contractToName,
} from "./migrationProvider";
import { MIGRATION_ENDPOINT_URL } from "./config";

function App() {
  const [address, setAddress] = useState("");

  const isConnected = Boolean(address);
  const [isConnecting, setIsConnecting] = useState(false);

  const [isMigrating, setIsMigrating] = useState(false);

  const [response, setResponse] = useState<any>(undefined);

  const [selectedContract, setSelectedContract] = useState("");

  const [balances, setBalances] = useState([] as any[]);

  const fetchBalances = async (walletAddress: string) => {
    const balances = await getBalances(walletAddress);
    setBalances(balances);
  };

  const connectWallet = useCallback(async () => {
    const provider = (window as any).ethereum;
    if (provider) {
      setIsConnecting(true);
      try {
        const accounts = await provider.request({
          method: "eth_requestAccounts",
          params: [],
        });

        return accounts;
      } catch (e) {
        console.error(e);
      } finally {
        setIsConnecting(false);
      }
    }
  }, [setIsConnecting]);

  useEffect(() => {
    if (!address) {
      return;
    }
    fetchBalances(address);
  }, [address]);

  const migrateXdefi = async () => {
    setIsMigrating(true);

    const payload = await permitMigration(address, selectedContract);

    try {
      const resp = await axios.post(MIGRATION_ENDPOINT_URL, payload);

      setResponse(resp.data);
      await fetchBalances(address);
    } catch (e: any) {
      console.error(e);
      if (e?.response?.data) {
        setResponse(e?.response?.data);
      }
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="App">
      <h1>XDEFI to CTRL migration test </h1>
      <div className="card">
        {isConnected ? (
          <>
            <div style={{ padding: "10px" }}>
              <select
                style={{ height: "40px", width: "200px" }}
                value={selectedContract}
                onChange={(e) => {
                  setSelectedContract(e.target.value);
                }}
              >
                <option value={""}>SELECT TOKEN </option>
                {supportedTokens.map((t) => (
                  <option value={t.contract}>{t.symbol}</option>
                ))}
              </select>
            </div>
            <div style={{ margin: "20px 0", padding: "10px" }}>
              <table cellSpacing={10}>
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Balance</th>
                    <td>Contract</td>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((bal) => (
                    <tr>
                      <td>{bal.symbol}</td>
                      <td>{bal.balance.toString()}</td>
                      <td>{bal.contract}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              disabled={isMigrating || !selectedContract}
              onClick={migrateXdefi}
            >
              {isMigrating
                ? "Migration is in progress..."
                : `Migrate ${contractToName[selectedContract]} to CTRL`}
            </button>
          </>
        ) : (
          <>
            <button
              disabled={isConnecting}
              onClick={async () => {
                const accounts = await connectWallet();
                setAddress(accounts[0]);
              }}
            >
              Connect wallet
            </button>
          </>
        )}
      </div>
      <p className="read-the-docs">
        {response ? JSON.stringify(response, null, 2) : null}
      </p>
    </div>
  );
}

export default App;
