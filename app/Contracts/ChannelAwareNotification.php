<?php

namespace App\Contracts;

/**
 * Notifications that need delivery channels injected at runtime.
 */
interface ChannelAwareNotification
{
    /**
     * @param  array<int, string>  $channels
     */
    public function withChannels(array $channels): static;
}
