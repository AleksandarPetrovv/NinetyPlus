import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function RateLimitMessage() {
  return (
    <div className="p-8 text-center bg-yellow-50 rounded-xl border border-yellow-200">
      <AccessTimeIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        API Rate Limit Reached
      </h3>
      <p className="text-yellow-600">
        Please wait 60 seconds. The API rate limit is 10 calls / minute.
      </p>
    </div>
  );
}