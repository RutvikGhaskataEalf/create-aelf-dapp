import * as React from "react";
import { IWalletInfo } from "aelf-sdk/types/wallet";
import AElf from "aelf-sdk";
import toast, { Toaster } from "react-hot-toast";
import { NextUIProvider } from "@nextui-org/react";

import "./index.css";
import { useGetContract } from "../../hooks/useGetContract";
import NormalFormItem from "../formal-form-field/index";
import { ISelectOption } from "../../interfaces/index";
import ReadWriteContract from "../read-write-contract/index";
import { getAElf } from "../../utilities/index";
import { rpcs } from "../../constant";

interface IProps {
  wallet?: IWalletInfo;
  headerTitle?: string;
  headerShown?: boolean;
  address?: string;
  contractName?: string;
  rpcUrl?: string;
  theme?: "light" | "dark";
}

const DEFAULT_RPC = rpcs[0].value;

export const ContractView = (props: IProps) => {
  const {
    wallet,
    headerTitle = "Aelf Contract View",
    headerShown = true,
    address,
    contractName = "Contract",
    rpcUrl = DEFAULT_RPC,
    theme = "light",
  } = props;
  const [aelfWallet, setAelfWallet] = React.useState<IWalletInfo>();
  const [rpc, setRpc] = React.useState(rpcUrl);
  const [rpcOptions, setRpcOptions] = React.useState(rpcs);
  const [contractOptions, setContractOptions] = React.useState<ISelectOption[]>([]);
  const [contractAddress, setContractAddress] = React.useState(address || "");
  const { contract, writeMethods, readMethods, isLoading } = useGetContract({
    rpc,
    contractAddress,
    wallet: aelfWallet,
  });

  const handleRpcChange = (rpcValue: string) => {
    setRpc(rpcValue);
  };

  const handleContractChange = (contractAddressValue: string) => {
    setContractAddress(contractAddressValue);
  };

  const getDefaultContract = async (rpcValue: string) => {
    let WALLET;
    const toastId = toast.loading("Get contract in progress..");
    try {
      if (wallet) {
        setAelfWallet(wallet);
        WALLET = wallet;
      } else {
        const newWallet = AElf.wallet.createNewWallet();
        setAelfWallet(newWallet);
        WALLET = newWallet;
      }

      if (WALLET && !address) {
        const aelfInstance = getAElf(rpcValue);
        const tokenContractName = "AElf.ContractNames.Token";
        const chainStatus = await aelfInstance.chain.getChainStatus();
        const GenesisContractAddress = chainStatus.GenesisContractAddress;
        const zeroContract = await aelfInstance.chain.contractAt(
          GenesisContractAddress,
          WALLET,
          {}
        );
        const tokenContractAddress =
          await zeroContract.GetContractAddressByName.call(
            AElf.utils.sha256(tokenContractName)
          );
        setContractOptions([
          { value: tokenContractAddress, label: "Token Contract" },
        ]);
        setContractAddress(tokenContractAddress);
      }
    } catch (error) {
      toast.error(`Get contract error: ${error}`);
    } finally {
      toast.dismiss(toastId);
    }
  };

  React.useEffect(() => {
    if (!address || !wallet) {
      getDefaultContract(rpc);
    }
    if (address) {
      setContractOptions([{ value: address, label: contractName }]);
    }
    if (wallet) {
      setAelfWallet(wallet);
    }
  }, [address, wallet]);

  return (
    <NextUIProvider>
      <div className={`contract-view-container ${theme}`}>
        <Toaster />
        {headerShown && (
          <header className="flex justify-center w-full py-5 text-[16px] font-semibold align-middle border-b-2">
            {headerTitle}
          </header>
        )}
        <div className="flex flex-col gap-6 px-4 py-6 w-full">
          <div className="box-wrapper">
            <NormalFormItem
              options={rpcOptions}
              selectedItem={rpc}
              onOptionsChange={(options) => setRpcOptions(options)}
              onSelectChange={handleRpcChange}
              title="RPC"
              buttonText="Add rpc"
              disabled={isLoading}
            />
            <NormalFormItem
              options={contractOptions}
              selectedItem={contractAddress}
              onOptionsChange={(options) => setContractOptions(options)}
              onSelectChange={handleContractChange}
              title="Contract"
              buttonText="Add contract"
              disabled={isLoading}
            />
          </div>
          <div className="box-wrapper">
            <ReadWriteContract
              readMethods={readMethods}
              writeMethods={writeMethods}
              contract={contract}
              wallet={aelfWallet}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </NextUIProvider>
  );
};
