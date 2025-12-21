import { useEffect, useState } from "react";

export default function Matches() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const response = await fetch("http://localhost:8080/api/matches");

                if (!response.ok) {
                    throw new Error("Failed to fetch matches");
                }

                const data = await response.json();
                setMatches(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, []);

    if (loading) {
        return <p className="text-center">Loading matches...</p>;
    }

    if (error) {
        return <p className="text-center text-red-600">{error}</p>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-12 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
                    <h1 className="text-3xl font-bold text-center text-white mb-6 drop-shadow-lg">
                        Upcoming Matches/ events
                    </h1>

                    <div className="space-y-3">
                        {matches.map(match => (
                            <div
                                key={match.id}
                                className="bg-white/90 backdrop-blur rounded-xl p-5 border border-gray-200 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-5">
                                    {/* Team From */}
                                    <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-100 to-white rounded-xl p-2 shadow-lg flex items-center justify-center">
                                            <img
                                                src={match.logoFrom}
                                                alt="From logo"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <span className="font-bold text-gray-900 text-base md:text-lg">
                                            {match.teamA}
                                        </span>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="flex-shrink-0 text-center px-4 md:px-5 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg w-full md:w-auto">
                                        <div className="text-xs text-gray-600 font-medium">
                                            {new Date(match.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-sm md:text-base font-bold text-purple-700">
                                            {new Date(match.date).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    {/* Team To */}
                                    <div className="flex items-center gap-3 flex-1 w-full md:w-auto justify-end">
                                        <span className="font-bold text-gray-900 text-base md:text-lg">
                                            {match.teamB}
                                        </span>
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-100 to-white rounded-xl p-2 shadow-lg flex items-center justify-center">
                                            <img
                                                src={match.logoTo}
                                                alt="To logo"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>

                                    {/* Event/Location */}
                                    <div className="bg-wheit-600 rounded-xl p-2 shadow-lg flex items-center justify-center w-full md:w-auto">
                                        <span className="text-xs md:text-sm font-black text-black">the event :{match.event} location :{match.location}</span>
                                    </div>

                                    {/* Book Button */}
                                    <button
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center gap-1 w-full md:w-auto"
                                    >
                                        <span className="text-sm md:text-base">Book</span>
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                            {match.availableSeats} seats
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
