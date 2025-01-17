import React from "react";
import { useDropzone } from "react-dropzone";
import { useAppDispatch } from "~src/store";
import { extractJSONStringFromBinary, parseAndValidate } from "./parse";
import { viewerActions } from "./viewerSlice";

export default function Dropzone({ className = "" }: { className?: string }) {
  const [msg, setMsg] = React.useState<string>("");
  const dispatch = useAppDispatch();

  const onDrop = React.useCallback((acceptedFiles) => {
    //do stuff?
    if (acceptedFiles.length > 0) {
      const reader = new FileReader();
      const file: File = acceptedFiles[0];

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr = new Uint8Array(reader.result as ArrayBuffer);
        console.log(binaryStr);

        let jsonData = extractJSONStringFromBinary(binaryStr);

        if (jsonData.err !== "") {
          console.log(
            "error encountered extracting json string: ",
            jsonData.err
          );
          setMsg("URL does not contain valid gzipped JSON file");
          return;
        }

        //try parsing
        const parsed = parseAndValidate(jsonData.data);

        if (typeof parsed === "string") {
          setMsg(parsed);
          return;
        }

        parsed.v2 = true;

        //make an id
        dispatch(
          viewerActions.addViewerData({
            key: file.name,
            data: parsed,
          })
        );
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className="h-full p-8 flex place-content-center items-center"
      >
        <div className="border-dashed border-2 p-8 h-full w-full flex place-content-center items-center">
          <div>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-lg">Drop the file here ...</p>
            ) : (
              <p className="text-lg">
                Drag 'n' drop gzipped json file from gcsim here, or click to
                select
              </p>
            )}
            {msg === "" ? null : <p className="text-lg text-red-700">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
