$user = App\Models\User::where('email', 'deejpotter@gmail.com')->first();
if ($user) {
    $user->password = Hash::make('qYLdzX3SV4');
    $user->save();
    echo "Password reset successful for " . $user->email . "\n";
} else {
    echo "User not found\n";
}
