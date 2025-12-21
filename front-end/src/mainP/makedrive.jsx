

import { useState } from "react";

export default function Makedrive() {
    // Available team logos
    const availableLogos = [
        { value: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg", label: "Manchester United" },
        { value: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg", label: "Manchester City" },
        { value: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg", label: "Chelsea" },
        { value: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg", label: "Liverpool" },
        { value: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg", label: "Arsenal" },
        { value: "https://upload.wikimedia.org/wikipedia/en/6/6d/Tottenham_Hotspur.svg", label: "Tottenham" },
        { value: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_(crest).svg", label: "Barcelona" },
        { value: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg", label: "Real Madrid" },
        { value: "https://upload.wikimedia.org/wikipedia/commons/d/da/Paris_Saint-Germain_Logo.svg", label: "PSG" },
        { value: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg", label: "Bayern Munich" },
        { value: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Juventus_FC_2017_logo.svg", label: "Juventus" },
        { value: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg", label: "AC Milan" }
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        teamA: "",
        teamB: "",
        event: "",
        location: "",
        date: "",
        availableSeats: "",
        logoFrom: "",
        logoTo: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch("http://localhost:8080/api/matches", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("Match created successfully!");
                setIsModalOpen(false);
                setFormData({
                    teamA: "",
                    teamB: "",
                    event: "",
                    location: "",
                    date: "",
                    availableSeats: "",
                    logoFrom: "",
                    logoTo: ""
                });
            } else {
                alert("Failed to create match");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error creating match");
        }
    };

    return (
        <>
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-8 py-4 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-3"
                >
                    <span className="text-2xl">+</span>
                    <span>Make a Drive</span>
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Create New Match</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-white hover:text-gray-200 text-3xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Team A */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Team A
                                    </label>
                                    <input
                                        type="text"
                                        name="teamA"
                                        value={formData.teamA}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Enter team name"
                                    />
                                </div>

                                {/* Team B */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Team B
                                    </label>
                                    <input
                                        type="text"
                                        name="teamB"
                                        value={formData.teamB}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Enter team name"
                                    />
                                </div>

                                {/* Event */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Event
                                    </label>
                                    <input
                                        type="text"
                                        name="event"
                                        value={formData.event}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="e.g., Championship"
                                    />
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Stadium name"
                                    />
                                </div>

                                {/* Date & Time */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Available Seats */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Available Seats
                                    </label>
                                    <input
                                        type="number"
                                        name="availableSeats"
                                        value={formData.availableSeats}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Number of seats"
                                    />
                                </div>

                                {/* Logo From - Dropdown */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Team A Logo
                                    </label>
                                    <select
                                        name="logoFrom"
                                        value={formData.logoFrom}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                    >
                                        <option value="">Select a team logo</option>
                                        {availableLogos.map((logo, index) => (
                                            <option key={index} value={logo.value}>
                                                {logo.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Logo To - Dropdown */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Team B Logo
                                    </label>
                                    <select
                                        name="logoTo"
                                        value={formData.logoTo}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                    >
                                        <option value="">Select a team logo</option>
                                        {availableLogos.map((logo, index) => (
                                            <option key={index} value={logo.value}>
                                                {logo.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all"
                                >
                                    Create Match
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

